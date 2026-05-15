from fastapi import APIRouter, Request, HTTPException, Depends
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin, get_requester_info, slugify

router = APIRouter()

# ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

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

# ─── ADMIN – POSTS ────────────────────────────────────────────────────────────

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

# ─── ADMIN – REVISIONS ────────────────────────────────────────────────────────

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
