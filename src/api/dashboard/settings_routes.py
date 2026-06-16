from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import discord
from datetime import datetime

from .dependencies import (
    get_current_user, get_bot, get_welcome_db, get_antispam_db, 
    get_globalchat_db, get_level_db, get_logging_db, 
    get_autorole_db, get_autodelete_db, get_tempvc_db
)
from .schemas import (
    GeneralSettingsUpdate, WelcomeSettingsUpdate, AntiSpamSettingsUpdate, 
    GlobalChatSettingsUpdate, LoggingSettingsUpdate, AutoRoleSettingsUpdate, 
    AutoDeleteItem, TempVCSettingsUpdate
)

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_user)]
)

async def send_dashboard_notification(bot_instance, guild_id: int, module_name: str, user_name: str, channel_id: int = None):
    """Helper to send a notification to a Discord channel when settings are saved."""
    if not bot_instance:
        return

    guild = bot_instance.get_guild(guild_id)
    if not guild:
        return

    # Try to find a suitable channel if none provided
    if not channel_id:
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
async def get_settings(guild_id: int, bot = Depends(get_bot)):
    """Fetch settings for a specific guild."""
    if not hasattr(bot, 'settings_db'):
         raise HTTPException(status_code=503, detail="Bot database not ready")
         
    try:
        guild_settings = bot.settings_db.get_guild_settings(guild_id) if hasattr(bot.settings_db, 'get_guild_settings') else {}
        guild_lang = guild_settings.get("language", "de")
        
        return {
            "success": True,
            "data": {
                "bot_name": bot.user.name,
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
async def update_settings(guild_id: int, data: GeneralSettingsUpdate, user: dict = Depends(get_current_user), bot = Depends(get_bot)):
    """Update general settings for a specific guild."""
    if not hasattr(bot, 'settings_db'):
         raise HTTPException(status_code=503, detail="Bot database not ready")
         
    try:
        update_data = data.model_dump(exclude_unset=True)
        if "user_role_id" in update_data and update_data["user_role_id"] is not None:
             update_data["user_role_id"] = int(update_data["user_role_id"])
        if "team_role_id" in update_data and update_data["team_role_id"] is not None:
             update_data["team_role_id"] = int(update_data["team_role_id"])
             
        if update_data and hasattr(bot.settings_db, 'update_guild_settings'):
            bot.settings_db.update_guild_settings(guild_id, **update_data)

        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "Allgemein", user_name)
        return {"success": True, "message": "Settings updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {e}")

# --- Welcome Module Routes ---
@router.get("/{guild_id}/channels")
async def get_guild_channels(guild_id: int, bot = Depends(get_bot)):
    """Returns a list of text channels for the guild."""
    guild = bot.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
        
    channels = [{"id": str(c.id), "name": c.name} for c in guild.text_channels]
    return {"success": True, "channels": channels}

@router.get("/{guild_id}/welcome")
async def get_welcome_settings(guild_id: int, db = Depends(get_welcome_db)):
    """Fetch welcome-specific settings."""
    try:
        await db.init_db()
        settings = await db.get_welcome_settings(guild_id)
        if settings and "channel_id" in settings and settings["channel_id"]:
            settings["channel_id"] = str(settings["channel_id"])
        if settings and "auto_role_id" in settings and settings["auto_role_id"]:
            settings["auto_role_id"] = str(settings["auto_role_id"])
            
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/welcome")
async def update_welcome_settings(guild_id: int, data: WelcomeSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_welcome_db), bot = Depends(get_bot)):
    """Update welcome-specific settings."""
    update_data = data.model_dump(exclude_unset=True)
    if "channel_id" in update_data and update_data["channel_id"]:
        update_data["channel_id"] = int(update_data["channel_id"])
    if "auto_role_id" in update_data and update_data["auto_role_id"]:
        update_data["auto_role_id"] = int(update_data["auto_role_id"])

    try:
        await db.init_db()
        success = await db.update_welcome_settings(guild_id, **update_data)
        if success:
            user_name = user.get("username", "Unbekannter User")
            cog = bot.get_cog("WelcomeSystem")
            if cog and hasattr(cog, 'invalidate_cache'):
                cog.invalidate_cache(guild_id)
            
            channel_id = update_data.get("channel_id")
            await send_dashboard_notification(bot, guild_id, "Welcome System", user_name, channel_id)
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save welcome settings: {e}")

# --- AntiSpam Module Routes ---
@router.get("/{guild_id}/antispam")
async def get_antispam_settings(guild_id: int, db = Depends(get_antispam_db)):
    """Fetch AntiSpam-specific settings."""
    try:
        await db.init_db()
        settings = await db.get_spam_settings(guild_id)
        if settings and "log_channel_id" in settings and settings["log_channel_id"]:
            settings["log_channel_id"] = str(settings["log_channel_id"])
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/antispam")
async def update_antispam_settings(guild_id: int, data: AntiSpamSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_antispam_db), bot = Depends(get_bot)):
    """Update AntiSpam-specific settings."""
    try:
        await db.init_db()
        log_channel_id = int(data.log_channel_id) if data.log_channel_id else None
        success = await db.set_spam_settings(
            guild_id, 
            max_messages=data.max_messages,
            time_frame=data.time_frame,
            log_channel_id=log_channel_id
        )
        if success:
            user_name = user.get("username", "Unbekannter User")
            await send_dashboard_notification(bot, guild_id, "Anti-Spam", user_name, log_channel_id)
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save AntiSpam settings: {e}")

# --- GlobalChat Module Routes ---
@router.get("/{guild_id}/globalchat")
async def get_globalchat_settings(guild_id: int, db = Depends(get_globalchat_db)):
    """Fetch GlobalChat-specific settings."""
    try:
        await db.init_db()
        settings = await db.get_guild_settings(guild_id)
        channel_id = await db.get_globalchat_channel(guild_id)
        settings["channel_id"] = str(channel_id) if channel_id else None
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/globalchat")
async def update_globalchat_settings(guild_id: int, data: GlobalChatSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_globalchat_db), bot = Depends(get_bot)):
    """Update GlobalChat-specific settings."""
    try:
        await db.init_db()
        success = True
        user_name = user.get("username", "Unbekannter User")
        
        new_channel_id = data.channel_id
        if new_channel_id is not None:
            success = await db.set_globalchat_channel(guild_id, int(new_channel_id))
        
        if data.filter_enabled is not None:
            await db.update_guild_setting(guild_id, "filter_enabled", data.filter_enabled)
        if data.nsfw_filter is not None:
            await db.update_guild_setting(guild_id, "nsfw_filter", data.nsfw_filter)
        if data.embed_color is not None:
            await db.update_guild_setting(guild_id, "embed_color", data.embed_color)
        
        if success:
            await send_dashboard_notification(bot, guild_id, "Global Chat", user_name, int(new_channel_id) if new_channel_id else None)
            
        return {"success": success}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save GlobalChat settings: {e}")

# --- LevelSystem Module Routes ---
@router.get("/{guild_id}/levels")
async def get_level_settings(guild_id: int, db = Depends(get_level_db)):
    """Fetch LevelSystem settings."""
    try:
        await db.init_db()
        settings = await db.get_guild_config(guild_id)
        return {"success": True, "data": settings or {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/levels")
async def update_level_settings(guild_id: int, data: Dict[str, Any], user: dict = Depends(get_current_user), db = Depends(get_level_db), bot = Depends(get_bot)):
    """Update LevelSystem settings."""
    try:
        await db.init_db()
        await db.set_guild_config(guild_id, **data)
        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "Level-System", user_name)
        return {"success": True}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save level settings: {e}")

# --- Logging Module Routes ---
@router.get("/{guild_id}/logging")
async def get_logging_settings(guild_id: int, db = Depends(get_logging_db)):
    """Fetch Logging settings."""
    try:
        await db.init_db()
        channels = await db.get_all_log_channels(guild_id)
        settings = {"channel_id": str(channels.get("general")) if channels.get("general") else None}
        return {"success": True, "data": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/logging")
async def update_logging_settings(guild_id: int, data: LoggingSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_logging_db), bot = Depends(get_bot)):
    """Update Logging settings."""
    try:
        await db.init_db()
        if data.channel_id is not None:
            await db.set_log_channel(guild_id, int(data.channel_id))
            
        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "Server-Log", user_name, int(data.channel_id) if data.channel_id else None)
        return {"success": True}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save logging settings: {e}")

# --- AutoRole Module Routes ---
@router.get("/{guild_id}/autorole")
async def get_autorole_settings(guild_id: int, db = Depends(get_autorole_db)):
    """Fetch AutoRole settings."""
    try:
        await db.init_db()
        roles = await db.get_all_autoroles(guild_id)
        settings = {}
        if roles:
            settings["role_id"] = str(roles[0]["role_id"])
            settings["enabled"] = roles[0]["enabled"]
            
        return {"success": True, "data": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/autorole")
async def update_autorole_settings(guild_id: int, data: AutoRoleSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_autorole_db), bot = Depends(get_bot)):
    """Update AutoRole settings."""
    try:
        await db.init_db()
        if data.role_id is not None:
            roles = await db.get_all_autoroles(guild_id)
            for r in roles:
                await db.remove_autorole(r["autorole_id"])
            await db.add_autorole(guild_id, int(data.role_id))

        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "Auto-Role", user_name)
        return {"success": True}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save autorole settings: {e}")

# --- AutoDelete Module Routes ---
@router.get("/{guild_id}/autodelete")
async def get_autodelete_settings(guild_id: int, db = Depends(get_autodelete_db)):
    """Fetch AutoDelete settings."""
    try:
        await db.init_db()
        settings = await db.get_all()
        # TODO: Filter by guild if the DB supports it
        return {"success": True, "data": settings or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.post("/{guild_id}/autodelete")
async def update_autodelete_settings(guild_id: int, items: List[AutoDeleteItem], user: dict = Depends(get_current_user), db = Depends(get_autodelete_db), bot = Depends(get_bot)):
    """Update AutoDelete settings."""
    try:
        await db.init_db()
        for item in items:
            await db.add_autodelete(
                int(item.channel_id), 
                item.duration,
                item.exclude_pinned,
                item.exclude_bots
            )
        
        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "Auto-Delete", user_name)
        return {"success": True}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to save autodelete settings: {e}")

# --- TempVC Module Routes ---
@router.get("/{guild_id}/tempvc")
async def get_tempvc_settings(guild_id: int, db = Depends(get_tempvc_db)):
    """Fetch TempVC-specific settings."""
    try:
        await db.init_db()
        settings = await db.get_tempvc_settings(guild_id)
        if settings:
            data = {
                "creator_channel_id": str(settings[0]),
                "category_id": str(settings[1]),
                "auto_delete_time": settings[2]
            }
        else:
            data = {}
            
        ui_settings = await db.get_ui_settings(guild_id)
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
async def update_tempvc_settings(guild_id: int, data: TempVCSettingsUpdate, user: dict = Depends(get_current_user), db = Depends(get_tempvc_db), bot = Depends(get_bot)):
    """Update TempVC-specific settings."""
    try:
        await db.init_db()
        creator_channel_id = int(data.creator_channel_id) if data.creator_channel_id else 0
        category_id = int(data.category_id) if data.category_id else 0
        auto_delete_time = int(data.auto_delete_time) if data.auto_delete_time else 0
        
        if creator_channel_id and category_id:
            await db.set_tempvc_settings(guild_id, creator_channel_id, category_id, auto_delete_time)
        
        ui_enabled = bool(data.ui_enabled)
        ui_prefix = data.ui_prefix or "🔧"
        await db.set_ui_settings(guild_id, ui_enabled, ui_prefix)
        
        user_name = user.get("username", "Unbekannter User")
        await send_dashboard_notification(bot, guild_id, "TempVC System", user_name, creator_channel_id or None)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save TempVC settings: {e}")
