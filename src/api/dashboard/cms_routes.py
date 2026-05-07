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

    await db.create_media(
        filename=unique_name,
        original_name=file.filename or unique_name,
        mime_type=file.content_type,
        size_bytes=len(content),
        uploader_id=user_id,
        uploader_name=username
    )

    public_url = f"/uploads/cms/{unique_name}"
    return {"success": True, "url": public_url, "filename": unique_name}

@router.get("/media")
async def list_media(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: list all uploaded media files."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        media = await db.get_media()
        # Enrich with public URLs
        for m in media:
            m["url"] = f"/uploads/cms/{m['filename']}"
        return {"success": True, "data": media}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
