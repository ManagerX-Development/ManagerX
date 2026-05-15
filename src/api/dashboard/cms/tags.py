from fastapi import APIRouter, Request, HTTPException, Depends
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin, slugify

router = APIRouter()

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
