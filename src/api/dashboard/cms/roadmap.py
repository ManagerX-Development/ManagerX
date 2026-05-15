from fastapi import APIRouter, Request, HTTPException, Depends
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin

router = APIRouter()

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
