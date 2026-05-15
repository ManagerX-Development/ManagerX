from fastapi import APIRouter, Request, HTTPException, Depends
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin

router = APIRouter()

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
    
    feedbacks = await db.get_all_feedback()
    item = next((f for f in feedbacks if f["id"] == feedback_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    if item["status"] == "accepted":
        raise HTTPException(status_code=400, detail="Already moved to roadmap")

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
        
    await db.update_feedback_status(feedback_id, "accepted")
    return {"success": True}
