from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from src.api.dashboard.auth_routes import get_current_user
from mxmariadb import CMSDatabase
from src.bot.core.config import BotConfig
import re
import uuid
import os
import aiofiles
from pathlib import Path

# Upload-Verzeichnis
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "public" / "uploads" / "cms"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/svg+xml", "video/mp4", "application/pdf"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

router = APIRouter(
    prefix="/cms",
    tags=["cms"]
)

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def slugify(text: str) -> str:
    """Simple slugify function."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

async def get_maybe_user(request: Request):
    """Optional JWT user – returns None if unauthenticated."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        return get_current_user(request)
    except Exception:
        return None

def is_admin(request: Request, user: dict = None) -> bool:
    """Check if the requester is a bot owner or CMS admin."""
    bypass_enabled = getattr(BotConfig.api, 'localhost_bypass', False)
    client_ip = request.client.host

    if bypass_enabled and client_ip in ["127.0.0.1", "localhost"]:
        x_user_id = request.headers.get("X-User-ID")
        if x_user_id:
            if x_user_id == "cms_admin":
                return True
            try:
                user_id = int(x_user_id)
                owners = getattr(BotConfig.security, 'bot_owners', [])
                if user_id in owners:
                    print(f"[DEBUG] CMS Access granted via Localhost Bypass for ID {user_id}")
                    return True
            except (ValueError, TypeError):
                pass

    if not user:
        return False

    uid = user["id"]
    if uid == "cms_admin":
        return True

    try:
        user_id = int(uid)
        owners = getattr(BotConfig.security, 'bot_owners', [])
        return user_id in owners
    except (ValueError, TypeError):
        return False

def get_requester_info(request: Request, user: dict) -> tuple[int, str]:
    """Returns (user_id, username) from JWT or fallback header."""
    if user:
        try:
            return int(user["id"]), user.get("username", "Unknown")
        except (ValueError, TypeError):
            # Special case for non-numeric IDs like 'cms_admin'
            return 0, user.get("username", "Unknown")
    
    x_user_id = request.headers.get("X-User-ID")
    try:
        return int(x_user_id) if x_user_id else 0, "Admin"
    except (ValueError, TypeError):
        return 0, "Admin"

async def get_cms_db() -> CMSDatabase:
    db = CMSDatabase()
    await db.ensure_connection()
    return db

# ─────────────────────────────────────────
# PUBLIC ENDPOINTS
# ─────────────────────────────────────────

@router.get("/posts")
async def get_public_posts(post_type: str = None, db: CMSDatabase = Depends(get_cms_db)):
    """Get all published posts, optionally filtered by type."""
    try:
        posts = await db.get_posts(post_type=post_type, published_only=True)
        return {"success": True, "data": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts/by-slug/{slug}")
async def get_post_by_slug(slug: str, db: CMSDatabase = Depends(get_cms_db)):
    """Get a single published post by slug and increment view count."""
    try:
        post = await db.get_post_by_slug(slug)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        await db.increment_view_count(post["id"])
        return {"success": True, "data": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/changelog")
async def get_public_changelog(limit: int = 50, db: CMSDatabase = Depends(get_cms_db)):
    """Public changelog feed."""
    try:
        entries = await db.get_changelog(limit=limit)
        return {"success": True, "data": entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────
# ADMIN – POSTS
# ─────────────────────────────────────────

@router.get("/admin/posts")
async def get_admin_posts(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: list ALL posts (drafts + published)."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        posts = await db.get_posts(published_only=False)
        return {"success": True, "data": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/posts")
async def create_post(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: create a new post. Automatically saves a revision on creation."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")

    data = await request.json()
    title = data.get("title")
    content = data.get("content")
    if not title or not content:
        raise HTTPException(status_code=400, detail="Title and content are required")

    post_type    = data.get("post_type", "dev")
    is_published = data.get("is_published", False)
    tags         = data.get("tags", "")
    slug         = data.get("slug") or slugify(title)
    scheduled_at = data.get("scheduled_at")
    excerpt      = data.get("excerpt")
    cover_image  = data.get("cover_image")

    user_id, username = get_requester_info(request, user)

    try:
        await db.create_post(
            post_type=post_type, title=title, slug=slug, content=content,
            author_id=user_id, author_name=username, tags=tags,
            is_published=is_published, scheduled_at=scheduled_at,
            excerpt=excerpt, cover_image=cover_image
        )
        return {"success": True}
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Slug already exists")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/posts/{post_id}")
async def update_post(post_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: update a post and save a revision snapshot."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")

    data = await request.json()
    user_id, username = get_requester_info(request, user)

    # Save revision BEFORE update (if substantial fields changed)
    revision_fields = {"title", "content", "tags", "cover_image", "excerpt"}
    if revision_fields & set(data.keys()):
        old_post = await db.get_post_by_id(post_id)
        if old_post:
            try:
                await db.save_revision(
                    post_id=post_id,
                    title=old_post.get("title", ""),
                    content=old_post.get("content", ""),
                    tags=old_post.get("tags", ""),
                    cover_image=old_post.get("cover_image"),
                    excerpt=old_post.get("excerpt"),
                    changed_by_id=user_id,
                    changed_by_name=username,
                    change_note=data.get("change_note")
                )
            except Exception as rev_err:
                print(f"[WARN] Revision save failed: {rev_err}")

    try:
        await db.update_post(post_id, **data)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: delete a post (cascades to revisions)."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        await db.delete_post(post_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────
# ADMIN – REVISIONS
# ─────────────────────────────────────────

@router.get("/posts/{post_id}/revisions")
async def get_revisions(post_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: get revision history for a post."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        revisions = await db.get_revisions(post_id)
        return {"success": True, "data": revisions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revisions/{revision_id}")
async def get_single_revision(revision_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: get full content of a specific revision."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    rev = await db.get_revision_by_id(revision_id)
    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found")
    return {"success": True, "data": rev}

@router.post("/posts/{post_id}/restore/{revision_id}")
async def restore_revision(post_id: int, revision_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: restore a post to a specific revision."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")

    rev = await db.get_revision_by_id(revision_id)
    if not rev or rev["post_id"] != post_id:
        raise HTTPException(status_code=404, detail="Revision not found for this post")

    user_id, username = get_requester_info(request, user)

    # Save current state as a revision first
    old = await db.get_post_by_id(post_id)
    if old:
        await db.save_revision(
            post_id=post_id,
            title=old["title"], content=old["content"],
            tags=old.get("tags", ""), cover_image=old.get("cover_image"),
            excerpt=old.get("excerpt"),
            changed_by_id=user_id, changed_by_name=username,
            change_note=f"Auto-saved before restoring revision #{revision_id}"
        )

    await db.update_post(
        post_id,
        title=rev["title"],
        content=rev["content"],
        tags=rev.get("tags", ""),
        cover_image=rev.get("cover_image"),
        excerpt=rev.get("excerpt")
    )
    return {"success": True, "message": f"Restored to revision #{revision_id}"}

# ─────────────────────────────────────────
# ADMIN – MEDIA
# ─────────────────────────────────────────

@router.post("/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    is_stock: bool = False,
    user: dict = Depends(get_maybe_user),
    db: CMSDatabase = Depends(get_cms_db)
):
    """Admin: upload a media file. Returns the public URL."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    # Read file (with size check)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    # Generate unique filename preserving extension
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    user_id, username = get_requester_info(request, user)

    # Convert string boolean if sent via form-data
    form_data = await request.form()
    stock_flag = form_data.get("is_stock") == "true" or is_stock

    await db.create_media(
        filename=unique_name,
        original_name=file.filename or unique_name,
        mime_type=file.content_type,
        size_bytes=len(content),
        uploader_id=user_id,
        uploader_name=username,
        is_stock=stock_flag
    )

    public_url = f"/uploads/cms/{unique_name}"
    return {"success": True, "url": public_url, "filename": unique_name, "is_stock": stock_flag}

@router.get("/media")
async def list_media(request: Request, is_stock: bool = None, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: list uploaded media files, optionally filtered by stock status."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        media = await db.get_media(is_stock=is_stock)
        # Enrich with public URLs
        for m in media:
            m["url"] = f"/uploads/cms/{m['filename']}"
        return {"success": True, "data": media}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/media/{media_id}")
async def update_media_stock(media_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: toggle is_stock flag for media."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_media(media_id, data.get("is_stock", False))
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update media")
    return {"success": True}

# ─────────────────────────────────────────
# PUBLIC MEDIA VIEWER (FOR DISCORD EMBEDS)
# ─────────────────────────────────────────

from fastapi.responses import HTMLResponse

@router.get("/media/view/{media_id}", response_class=HTMLResponse)
async def view_media_embed(media_id: int, request: Request, db: CMSDatabase = Depends(get_cms_db)):
    """Public: Returns an HTML page with Open Graph tags for Discord embeds."""
    try:
        # We need a new method or just fetch all and filter, or add get_media_by_id
        media_list = await db.get_media(limit=1000)
        media_item = next((m for m in media_list if m["id"] == media_id), None)
        
        if not media_item:
            return HTMLResponse(content="<h1>Media not found</h1>", status_code=404)
        
        # Build absolute URL for the image
        base_url = str(request.base_url).rstrip('/')
        image_url = f"{base_url}/uploads/cms/{media_item['filename']}"
        
        # Format date safely
        date_str = "Unknown date"
        if media_item.get("uploaded_at"):
            date_str = media_item["uploaded_at"].strftime("%d.%m.%Y %H:%M")
            
        title = media_item["original_name"]
        description = f"Hochgeladen am: {date_str} von {media_item.get('uploader_name', 'Unknown')}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title} - ManagerX Media</title>
            
            <!-- Open Graph / Discord Meta Tags -->
            <meta property="og:type" content="website">
            <meta property="og:title" content="{title}">
            <meta property="og:description" content="{description}">
            <meta property="og:image" content="{image_url}">
            
            <meta name="theme-color" content="#3498db">
            
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="{title}">
            <meta name="twitter:description" content="{description}">
            <meta name="twitter:image" content="{image_url}">
            
            <style>
                body {{ background-color: #050505; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                img {{ max-width: 90%; max-height: 80vh; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }}
                .info {{ margin-top: 20px; text-align: center; color: #a1a1aa; }}
                h1 {{ font-size: 1.2rem; color: #fff; margin-bottom: 5px; }}
            </style>
        </head>
        <body>
            <img src="{image_url}" alt="{title}">
            <div class="info">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Error</h1><p>{str(e)}</p>", status_code=500)


@router.delete("/media/{media_id}")
async def delete_media(media_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: delete a media file from DB and disk."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        filename = await db.delete_media(media_id)
        if filename:
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                file_path.unlink()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────
# ADMIN – TAGS
# ─────────────────────────────────────────

@router.get("/tags")
async def list_tags(db: CMSDatabase = Depends(get_cms_db)):
    """Public/Admin: list all tags."""
    try:
        tags = await db.get_tags()
        return {"success": True, "data": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tags")
async def create_tag(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: create a new tag."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
        
    slug = data.get("slug") or slugify(name)
    color = data.get("color", "#3498db")
    emoji = data.get("emoji", "")
    
    success = await db.create_tag(name=name, slug=slug, color=color, emoji=emoji)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create tag")
    return {"success": True}

@router.put("/tags/{tag_id}")
async def update_tag(tag_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: update an existing tag."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_tag(tag_id, **data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update tag")
    return {"success": True}

@router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: delete a tag."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await db.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete tag")
    return {"success": True}

# ─────────────────────────────────────────
# ROADMAP ROUTES
# ─────────────────────────────────────────

@router.get("/roadmap")
async def get_roadmap(db: CMSDatabase = Depends(get_cms_db)):
    """Public: Get all roadmap items."""
    items = await db.get_roadmap()
    return {"success": True, "data": items}

@router.post("/roadmap")
async def create_roadmap_item(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Create a new roadmap item."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.create_roadmap_item(
        title=data.get("title"),
        status=data.get("status", "planned"),
        description=data.get("description"),
        icon=data.get("icon", "Rocket"),
        date_info=data.get("date_info"),
        order_index=data.get("order_index", 0)
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create roadmap item")
    return {"success": True}

@router.put("/roadmap/{item_id}")
async def update_roadmap_item(item_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Update an existing roadmap item."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_roadmap_item(
        item_id=item_id,
        title=data.get("title"),
        status=data.get("status"),
        description=data.get("description"),
        icon=data.get("icon"),
        date_info=data.get("date_info"),
        order_index=data.get("order_index", 0)
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update roadmap item")
    return {"success": True}

@router.delete("/roadmap/{item_id}")
async def delete_roadmap_item(item_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Delete a roadmap item."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await db.delete_roadmap_item(item_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete roadmap item")
    return {"success": True}

# ─────────────────────────────────────────
# TEAM CATEGORIES ROUTES
# ─────────────────────────────────────────

@router.get("/team-categories")
async def get_team_categories(db: CMSDatabase = Depends(get_cms_db)):
    """Public: Get all team categories."""
    items = await db.get_team_categories()
    return {"success": True, "data": items}

@router.post("/team-categories")
async def create_team_category(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Create a new team category."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.create_team_category(data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create category")
    return {"success": True}

@router.put("/team-categories/{cat_id}")
async def update_team_category(cat_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Update a team category."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_team_category(cat_id, data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update category")
    return {"success": True}

@router.delete("/team-categories/{cat_id}")
async def delete_team_category(cat_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Delete a team category."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await db.delete_team_category(cat_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete category")
    return {"success": True}

# ─────────────────────────────────────────
# TEAM ROUTES
# ─────────────────────────────────────────

@router.get("/team")
async def get_team(db: CMSDatabase = Depends(get_cms_db)):
    """Public: Get all team members."""
    items = await db.get_team()
    return {"success": True, "data": items}

@router.post("/team")
async def create_team_member(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Create a new team member."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.create_team_member(data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create team member")
    return {"success": True}

@router.put("/team/{member_id}")
async def update_team_member(member_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Update an existing team member."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_team_member(member_id, data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update team member")
    return {"success": True}

@router.delete("/team/{member_id}")
async def delete_team_member(member_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Delete a team member."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await db.delete_team_member(member_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete team member")
    return {"success": True}

# ─────────────────────────────────────────
# FEEDBACK ROUTES
# ─────────────────────────────────────────

@router.get("/feedback")
async def get_all_feedback(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Get all feedback items."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items = await db.get_all_feedback()
    return {"success": True, "data": items}

@router.put("/feedback/{feedback_id}/status")
async def update_feedback_status(feedback_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Update feedback status."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    status = data.get("status")
    if status not in ["new", "read", "accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    success = await db.update_feedback_status(feedback_id, status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update status")
    return {"success": True}

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Delete a feedback item."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await db.delete_feedback(feedback_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete feedback")
    return {"success": True}

@router.post("/feedback/{feedback_id}/to-roadmap")
async def move_feedback_to_roadmap(feedback_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: Move a feedback item to the roadmap and mark as accepted."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 1. Feedback abrufen
    feedbacks = await db.get_all_feedback()
    item = next((f for f in feedbacks if f["id"] == feedback_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    if item["status"] == "accepted":
        raise HTTPException(status_code=400, detail="Already moved to roadmap")

    # 2. Roadmap Eintrag erstellen
    title = f"User Vorschlag ({item['user_name']})" if item["type"] == "suggestion" else f"Bugfix ({item['user_name']})"
    icon = "Sparkles" if item["type"] == "suggestion" else "ShieldAlert"
    description = item["content"]
    
    success_roadmap = await db.create_roadmap_item(
        title=title,
        status="planned",
        description=description,
        icon=icon,
        date_info="Demnächst"
    )
    
    if not success_roadmap:
        raise HTTPException(status_code=500, detail="Failed to create roadmap item")
        
    # 3. Status auf accepted setzen
    await db.update_feedback_status(feedback_id, "accepted")
    
    return {"success": True}
