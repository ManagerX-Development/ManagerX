from fastapi import APIRouter, Request, HTTPException, Depends
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin

router = APIRouter()

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
