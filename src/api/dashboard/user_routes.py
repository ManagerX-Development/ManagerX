from fastapi import APIRouter, Request, HTTPException, Depends
from src.api.dashboard.auth_routes import get_current_user
from mx_devtools import SettingsDB
import discord

router = APIRouter(
    prefix="/user",
    tags=["user"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/settings")
async def get_user_settings(user: dict = Depends(get_current_user)):
    """Fetch user settings from SettingsDB."""
    settings_db = SettingsDB()
    try:
        user_id = int(user["id"])
        
        # Get language setting from SettingsDB
        language = settings_db.get_user_language(user_id)
        
        return {
            "success": True, 
            "data": {
                "user_id": str(user_id),
                "language": language,
                "username": user.get("username", "Unknown")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/settings")
async def update_user_settings(request: Request, user: dict = Depends(get_current_user)):
    """Update user settings in SettingsDB."""
    data = await request.json()
    settings_db = SettingsDB()
    try:
        user_id = int(user["id"])
        
        # Update language in SettingsDB if provided
        if "language" in data:
            settings_db.set_user_language(user_id, data["language"])
                
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")
