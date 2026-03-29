from fastapi import APIRouter, Request, HTTPException, Security, status, Depends
from src.api.dashboard.auth_routes import get_current_user
from mx_devtools import WelcomeDatabase, AntiSpamDatabase, GlobalChatDatabase, LevelDatabase, LoggingDatabase, AutoDeleteDB, AutoRoleDatabase, TempVCDatabase
import discord
from datetime import datetime

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_user)]
)

async def send_dashboard_notification(guild_id: int, module_name: str, user_name: str, channel_id: int = None):
    """Helper to send a notification to a Discord channel when settings are saved."""
    from src.api.dashboard.routes import bot_instance
    if not bot_instance:
        return

    guild = bot_instance.get_guild(guild_id)
    if not guild:
        return

    # Try to find a suitable channel if none provided
    if not channel_id:
        # For general settings, we might use a system channel or first available
        target_channel = guild.system_channel or guild.text_channels[0]
    else:
        target_channel = guild.get_channel(channel_id)

    if not target_channel:
        return

    embed = discord.Embed(
        title="⚙️ Dashboard Einstellungen aktualisiert",
        description=f"Die Einstellungen für das Modul **{module_name}** wurden über das Dashboard geändert.",
        color=discord.Color.blue(),
        timestamp=datetime.now()
    )
    embed.add_field(name="Administrator", value=user_name, inline=True)
    embed.add_field(name="Modul", value=module_name, inline=True)
    embed.set_footer(text="ManagerX Dashboard System", icon_url=bot_instance.user.avatar.url if bot_instance.user.avatar else None)

    try:
        await target_channel.send(embed=embed)
    except Exception as e:
        print(f"Failed to send dashboard notification: {e}")

@router.get("/{guild_id}")
async def get_settings(guild_id: int):
    """Fetch settings for a specific guild."""
    from src.api.dashboard.routes import bot_instance
    
    if not bot_instance or not hasattr(bot_instance, 'settings_db'):
         raise HTTPException(status_code=503, detail="Bot database not ready")
         
    try:
        guild_settings = bot_instance.settings_db.get_guild_settings(guild_id) if hasattr(bot_instance.settings_db, 'get_guild_settings') else {}
        guild_lang = guild_settings.get("language", "de")
        
        return {
            "success": True,
            "data": {
                "bot_name": bot_instance.user.name,
                "prefix": "!" ,
                "auto_mod": True,
                "welcome_message": False,
                "language": guild_lang,
                "user_role_id": str(guild_settings.get("user_role_id")) if guild_settings.get("user_role_id") else None,
                "team_role_id": str(guild_settings.get("team_role_id")) if guild_settings.get("team_role_id") else None
            }
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/{guild_id}")
async def update_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update general settings for a specific guild."""
    from src.api.dashboard.routes import bot_instance
    
    if not bot_instance or not hasattr(bot_instance, 'settings_db'):
         raise HTTPException(status_code=503, detail="Bot database not ready")
         
    data = await request.json()
    
    try:
        # Update logic
        update_data = {}
        if "language" in data:
             update_data["language"] = data["language"]
        if "user_role_id" in data:
             update_data["user_role_id"] = int(data["user_role_id"]) if data["user_role_id"] else None
        if "team_role_id" in data:
             update_data["team_role_id"] = int(data["team_role_id"]) if data["team_role_id"] else None
             
        if update_data and hasattr(bot_instance.settings_db, 'update_guild_settings'):
            bot_instance.settings_db.update_guild_settings(guild_id, **update_data)

        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(guild_id, "Allgemein", user_name)
        return {"success": True, "message": "Settings updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {e}")

# --- Welcome Module Routes ---

@router.get("/{guild_id}/channels")
async def get_guild_channels(guild_id: int):
    """Returns a list of text channels for the guild."""
    from src.api.dashboard.routes import bot_instance
    if not bot_instance:
        raise HTTPException(status_code=503, detail="Bot not ready")
        
    guild = bot_instance.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
        
    channels = [
        {"id": str(c.id), "name": c.name}
        for c in guild.text_channels
    ]
    return {"success": True, "channels": channels}

@router.get("/{guild_id}/welcome")
async def get_welcome_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch welcome-specific settings."""
    db = WelcomeDatabase()
    try:
        settings = await db.get_welcome_settings(guild_id)
        if settings and "channel_id" in settings and settings["channel_id"]:
            settings["channel_id"] = str(settings["channel_id"])
        if settings and "auto_role_id" in settings and settings["auto_role_id"]:
            settings["auto_role_id"] = str(settings["auto_role_id"])
            
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/welcome")
async def update_welcome_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update welcome-specific settings."""
    data = await request.json()
    db = WelcomeDatabase()
    
    if "channel_id" in data and data["channel_id"]:
        data["channel_id"] = int(data["channel_id"])
    if "auto_role_id" in data and data["auto_role_id"]:
        data["auto_role_id"] = int(data["auto_role_id"])

    try:
        success = await db.update_welcome_settings(guild_id, **data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            # Invalidate cache if possible
            from src.api.dashboard.routes import bot_instance
            if bot_instance:
                cog = bot_instance.get_cog("WelcomeSystem")
                if cog and hasattr(cog, 'invalidate_cache'):
                    cog.invalidate_cache(guild_id)
            
            # Send notification to the welcome channel if configured
            channel_id = data.get("channel_id")
            await send_dashboard_notification(guild_id, "Welcome System", user_name, channel_id)
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save welcome settings: {e}")

# --- AntiSpam Module Routes ---

@router.get("/{guild_id}/antispam")
async def get_antispam_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch AntiSpam-specific settings."""
    db = AntiSpamDatabase()
    try:
        settings = db.get_spam_settings(guild_id)
        if settings and "log_channel_id" in settings and settings["log_channel_id"]:
            settings["log_channel_id"] = str(settings["log_channel_id"])
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/antispam")
async def update_antispam_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update AntiSpam-specific settings."""
    data = await request.json()
    db = AntiSpamDatabase()
    
    if "log_channel_id" in data and data["log_channel_id"]:
        data["log_channel_id"] = int(data["log_channel_id"])

    try:
        # Use set_spam_settings with direct kwargs if possible, or mapping
        success = db.set_spam_settings(
            guild_id, 
            max_messages=data.get("max_messages", 5),
            time_frame=data.get("time_frame", 10),
            log_channel_id=data.get("log_channel_id")
        )
        if success:
            user_name = user.get("username", "Unbekannter User")
            from src.api.dashboard.routes import bot_instance
            if bot_instance:
                cog = bot_instance.get_cog("AntiSpam")
                # Add cache invalidation if AntiSpam cog supports it
                
            await send_dashboard_notification(guild_id, "Anti-Spam", user_name, data.get("log_channel_id"))
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save AntiSpam settings: {e}")

# --- GlobalChat Module Routes ---

@router.get("/{guild_id}/globalchat")
async def get_globalchat_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch GlobalChat-specific settings."""
    db = GlobalChatDatabase()
    try:
        settings = db.get_guild_settings(guild_id)
        channel_id = db.get_globalchat_channel(guild_id)
        settings["channel_id"] = str(channel_id) if channel_id else None
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/globalchat")
async def update_globalchat_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update GlobalChat-specific settings."""
    data = await request.json()
    db = GlobalChatDatabase()
    
    try:
        success = True
        user_name = user.get("username", "Unbekannter User")
        
        # Handle channel_id separately
        new_channel_id = data.get("channel_id")
        if new_channel_id:
            success = db.set_globalchat_channel(guild_id, int(new_channel_id))
        
        # Update other settings
        for key in ["filter_enabled", "nsfw_filter", "embed_color"]:
            if key in data:
                db.update_guild_setting(guild_id, key, data[key])
        
        if success:
            await send_dashboard_notification(guild_id, "Global Chat", user_name, int(new_channel_id) if new_channel_id else None)
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save GlobalChat settings: {e}")

# --- LevelSystem Module Routes ---

@router.get("/{guild_id}/levels")
async def get_level_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch LevelSystem settings."""
    db = LevelDatabase()
    try:
        settings = db.get_guild_settings(guild_id)
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/levels")
async def update_level_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update LevelSystem settings."""
    data = await request.json()
    db = LevelDatabase()
    try:
        success = db.update_guild_settings(guild_id, **data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            await send_dashboard_notification(guild_id, "Level-System", user_name)
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save level settings: {e}")

# --- Logging Module Routes ---

@router.get("/{guild_id}/logging")
async def get_logging_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch Logging settings."""
    db = LoggingDatabase()
    try:
        settings = db.get_guild_settings(guild_id)
        if settings and "channel_id" in settings and settings["channel_id"]:
            settings["channel_id"] = str(settings["channel_id"])
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/logging")
async def update_logging_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update Logging settings."""
    data = await request.json()
    db = LoggingDatabase()
    
    if "channel_id" in data and data["channel_id"]:
        data["channel_id"] = int(data["channel_id"])

    try:
        success = db.update_guild_settings(guild_id, **data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            await send_dashboard_notification(guild_id, "Server-Log", user_name, data.get("channel_id"))
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save logging settings: {e}")

# --- AutoRole Module Routes ---

@router.get("/{guild_id}/autorole")
async def get_autorole_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch AutoRole settings."""
    db = AutoRoleDatabase()
    try:
        settings = db.get_guild_settings(guild_id)
        if settings and "role_id" in settings and settings["role_id"]:
            settings["role_id"] = str(settings["role_id"])
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/autorole")
async def update_autorole_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update AutoRole settings."""
    data = await request.json()
    db = AutoRoleDatabase()
    
    if "role_id" in data and data["role_id"]:
        data["role_id"] = int(data["role_id"])

    try:
        success = db.update_guild_settings(guild_id, **data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            await send_dashboard_notification(guild_id, "Auto-Role", user_name)
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save autorole settings: {e}")

# --- AutoDelete Module Routes ---

@router.get("/{guild_id}/autodelete")
async def get_autodelete_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch AutoDelete settings."""
    db = AutoDeleteDB()
    try:
        settings = db.get_guild_settings(guild_id)
        return {"success": True, "data": settings or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/autodelete")
async def update_autodelete_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update AutoDelete settings."""
    data = await request.json()
    db = AutoDeleteDB()
    try:
        # Assuming db.update_guild_settings(guild_id, data) where data is a list of channel configs
        success = db.update_guild_settings(guild_id, data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            await send_dashboard_notification(guild_id, "Auto-Delete", user_name)
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save autodelete settings: {e}")
# --- TempVC Module Routes ---

@router.get("/{guild_id}/tempvc")
async def get_tempvc_settings(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetch TempVC-specific settings."""
    db = TempVCDatabase()
    try:
        settings = db.get_tempvc_settings(guild_id)
        if settings:
            # result is tuple: (creator_channel_id, category_id, auto_delete_time)
            data = {
                "creator_channel_id": str(settings[0]),
                "category_id": str(settings[1]),
                "auto_delete_time": settings[2]
            }
        else:
            data = {}
            
        # Get UI settings
        ui_settings = db.get_ui_settings(guild_id)
        if ui_settings:
            data["ui_enabled"] = bool(ui_settings[0])
            data["ui_prefix"] = ui_settings[1]
        else:
            data["ui_enabled"] = False
            data["ui_prefix"] = "🔧"
            
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/tempvc")
async def update_tempvc_settings(guild_id: int, request: Request, user: dict = Depends(get_current_user)):
    """Update TempVC-specific settings."""
    data = await request.json()
    db = TempVCDatabase()
    
    try:
        # Update main settings
        creator_channel_id = int(data.get("creator_channel_id")) if data.get("creator_channel_id") else 0
        category_id = int(data.get("category_id")) if data.get("category_id") else 0
        auto_delete_time = int(data.get("auto_delete_time", 0))
        
        if creator_channel_id and category_id:
            db.set_tempvc_settings(guild_id, creator_channel_id, category_id, auto_delete_time)
        
        # Update UI settings
        ui_enabled = bool(data.get("ui_enabled", False))
        ui_prefix = data.get("ui_prefix", "🔧")
        db.set_ui_settings(guild_id, ui_enabled, ui_prefix)
        
        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(guild_id, "TempVC System", user_name, creator_channel_id or None)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save TempVC settings: {e}")
