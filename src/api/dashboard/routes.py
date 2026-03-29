from fastapi import APIRouter, Request, HTTPException, Security, status, Depends
from fastapi.security import APIKeyHeader
import os
import discord
from src.api.dashboard.auth_routes import get_current_user
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import time
# Falls du Schemas nutzt: from .schemas import ServerStatus, UserInfo

from .auth_routes import router as auth_router
from .settings_routes import router as settings_router
from .user_routes import router as user_router

# Wir erstellen einen Router, den wir später in die Haupt-App einbinden
router_public = APIRouter(
    prefix="/v1/managerx",
    tags=["public"]
)

# Global Bot-Referenz (wird später in main.py gesetzt)
bot_instance = None

def set_bot_instance(bot):
    """
    Setzt die globale Bot-Instanz für die API.
    Diese Funktion wird aus main.py aufgerufen.
    
    Args:
        bot: Die discord.py Bot-Instanz
    """
    global bot_instance
    bot_instance = bot


@router_public.get("/stats", response_model=dict)
async def get_stats(request: Request):
    """
    Endpoint to get the current server status with real bot data.
    
    Returns:
        dict: Server status mit echten Bot-Daten
    """
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    try:
        # Berechne Uptime (Robust gegen Naive/Aware-Mix)
        now = discord.utils.utcnow()
        start = getattr(bot_instance, 'start_time', now)
        
        # Sicherstellen, dass beide aware sind
        if start.tzinfo is None:
             start = start.replace(tzinfo=timezone.utc)
             
        uptime_seconds = (now - start).total_seconds()
        uptime_minutes, remainder = divmod(int(uptime_seconds), 60)
        uptime_hours, uptime_minutes = divmod(uptime_minutes, 60)
        uptime_days, uptime_hours = divmod(uptime_hours, 24)
        
        uptime_str = f"{int(uptime_days)}d {int(uptime_hours)}h {int(uptime_minutes)}m"
        
        # Sammle echte Daten vom Bot
        server_status = {
            "uptime": uptime_str,
            "latency": f"{round(bot_instance.latency * 1000)}ms",
            "guilds": len(bot_instance.guilds),
            "users": len(bot_instance.users),
            "bot_name": bot_instance.user.name if bot_instance.user else "Unknown",
            "bot_id": bot_instance.user.id if bot_instance.user else None,
            "status": "online" if bot_instance.latency != float('inf') else "offline",
            "database": "connected" if hasattr(bot_instance, 'settings_db') and bot_instance.settings_db else "disconnected"
        }
        return server_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router_public.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """
    Fetches the global leaderboard from StatsDB and enriches it with Discord data.
    """
    from mx_devtools import StatsDB
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    try:
        stats_db = StatsDB()
        # get_leaderboard returns user_id, global_level, global_xp, total_messages, total_voice_minutes
        rows = await stats_db.get_leaderboard(limit=limit)
        
        leaderboard = []
        for row in rows:
            uid = row[0]
            is_private = row[5] if len(row) > 5 else 0
            
            if is_private:
                username = "Anonymer Nutzer"
                avatar = None
            else:
                user = bot_instance.get_user(uid)
                username = user.name if user else f"User {uid}"
                avatar = user.display_avatar.url if user else None
            
            leaderboard.append({
                "user_id": str(uid),
                "username": username,
                "avatar_url": avatar,
                "level": row[1],
                "xp": row[2],
                "messages": row[3],
                "voice_minutes": round(row[4], 1)
            })
            
        return {"success": True, "leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router_public.get("/version")
async def get_version(request: Request):
    return {
        "pypi_version": "1.2026.2.26",
        "bot_version": "v2.0.0-open-beta"
    }
    

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key_header: str = Security(API_KEY_HEADER)):
    """Überprüft den API-Key aus dem Header."""
    allowed_keys = os.getenv("DASHBOARD_API_KEYS")
    
    if not allowed_keys:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Keine API-Keys konfiguriert (DASHBOARD_API_KEYS fehlt)"
        )
    
    key_list = [k.strip() for k in allowed_keys.split(",") if k.strip()]
    
    if not api_key_header or api_key_header not in key_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert: Ungültiger API-Key"
        )
    return api_key_header

dashboard_main_router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

# Public sub-routers (no global X-API-KEY required, they manage their own like JWT)
@dashboard_main_router.get("/guilds/{guild_id}/channels")
async def get_guild_channels(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches text channels for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    # Check if user is in guild and has appropriate permissions (Manage Guild or Admin)
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    channels = [
        {"id": str(c.id), "name": c.name}
        for c in guild.text_channels
    ]
    return {"channels": channels}

@dashboard_main_router.get("/guilds/{guild_id}/roles")
async def get_guild_roles(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches manageable roles for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    roles = [
        {"id": str(r.id), "name": r.name, "color": str(r.color)}
        for r in guild.roles
        if not r.is_default() and not r.managed
    ]
    return {"roles": roles}

@dashboard_main_router.get("/guilds/{guild_id}/categories")
async def get_guild_categories(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches categories for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    categories = [
        {"id": str(c.id), "name": c.name}
        for c in guild.categories
    ]
    return {"categories": categories}

@dashboard_main_router.get("/guilds/{guild_id}/voice_channels")
async def get_guild_voice_channels(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches voice channels for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    channels = [
        {"id": str(c.id), "name": c.name}
        for c in guild.voice_channels
    ]
    return {"channels": channels}

@dashboard_main_router.get("/guilds/{guild_id}/stats")
async def get_guild_stats(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches server statistics (Daily joins, message count, member total)."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Fetch daily growth/activity
    today_dt = discord.utils.utcnow()
    today_str = today_dt.strftime('%Y-%m-%d')
    yesterday_str = (today_dt - timedelta(days=1)).strftime('%Y-%m-%d')
    joined_today = 0
    joined_yesterday = 0
    messages_today = 0
    messages_yesterday = 0
    history = []

    try:
        # Pre-fetch histories
        welcome_history = []
        stats_history = []
        
        if hasattr(bot_instance, 'welcome_db'):
            welcome_history = await bot_instance.welcome_db.get_weekly_stats(guild_id)
            for day in welcome_history:
                if day['date'] == today_str:
                    joined_today = day['joins']
                elif day['date'] == yesterday_str:
                    joined_yesterday = day['joins']
        
        if hasattr(bot_instance, 'stats_db'):
            messages_today = await bot_instance.stats_db.get_daily_messages(guild_id, today_str)
            messages_yesterday = await bot_instance.stats_db.get_daily_messages(guild_id, yesterday_str)
            stats_history = await bot_instance.stats_db.get_weekly_stats(guild_id)

        # 2. Combine history for the last 7 days
        for i in range(6, -1, -1):
            date_obj = today_dt - timedelta(days=i)
            d_str = date_obj.strftime('%Y-%m-%d')
            day_name = date_obj.strftime('%a')
            m_count = 0
            j_count = 0
            for h in stats_history:
                if h['date'] == d_str:
                    m_count = h['messages']; break
            for h in welcome_history:
                if h['date'] == d_str:
                    j_count = h['joins']; break
            history.append({"name": day_name, "messages": m_count, "joins": j_count})

        # Calculate Trends
        def calc_trend(today, yesterday):
            if today == yesterday:
                return "neutral", "0%"
            if yesterday == 0:
                return "up", "+100%"
            diff = today - yesterday
            pct = round((abs(diff) / yesterday) * 100)
            return ("up" if diff > 0 else "down"), f"{'+' if diff > 0 else '-'}{pct}%"

        m_trend, m_trend_val = calc_trend(messages_today, messages_yesterday)
        j_trend, j_trend_val = calc_trend(joined_today, joined_yesterday)

        # Calculate Server Age (NEU)
        server_age_days = (today_dt - guild.created_at).days
        server_age_str = f"{server_age_days}d"

        # Fetch Staff / User Role members (NEU)
        staff_members_list = []
        user_members_list = []
        
        if hasattr(bot_instance, 'settings_db') and hasattr(bot_instance.settings_db, 'get_guild_settings'):
            guild_settings = bot_instance.settings_db.get_guild_settings(guild_id)
            team_role_id = guild_settings.get("team_role_id")
            user_role_id = guild_settings.get("user_role_id")
            
            if team_role_id:
                team_role = guild.get_role(int(team_role_id))
                if team_role:
                    for m in team_role.members:
                        staff_members_list.append({"name": m.display_name, "id": str(m.id), "avatar": m.display_avatar.url})
            
            if user_role_id:
                user_role = guild.get_role(int(user_role_id))
                if user_role:
                    for m in user_role.members:
                        user_members_list.append({"name": m.display_name, "id": str(m.id), "avatar": m.display_avatar.url})

        # Prepare final stats object
        total_members = guild.member_count or len(guild.members)
        online_members = 0
        if intents_working := guild.members:
            online_members = sum(1 for m in guild.members if m.status != discord.Status.offline)
        
        stats = {
            "total_members": total_members,
            "online_members": online_members,
            "text_channels": len(guild.text_channels),
            "voice_channels": len(guild.voice_channels),
            "joined_today": joined_today,
            "joined_trend": j_trend,
            "joined_trend_value": j_trend_val,
            "messages_today": messages_today,
            "messages_trend": m_trend,
            "messages_trend_value": m_trend_val,
            "history": history,
            "server_age": server_age_str,
            "staff_members": staff_members_list,
            "user_members": user_members_list
        }
        return stats
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "total_members": guild.member_count,
            "online_members": 0,
            "text_channels": len(guild.text_channels),
            "voice_channels": len(guild.voice_channels),
            "joined_today": 0,
            "messages_today": 0
        }

@dashboard_main_router.get("/guilds/{guild_id}/mega-data")
async def get_mega_data(guild_id: int, user: dict = Depends(get_current_user)):
    """Consolidated endpoint for dashboard landing page (Settings, Stats, Metadata)."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member:
        try:
            member = await guild.fetch_member(int(user["id"]))
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # 1. Fetch Stats (reuse logic)
        try:
            stats = await get_guild_stats(guild_id, user)
        except:
            stats = {}

        # 2. Fetch Settings & Module Status
        from mx_devtools import WelcomeDatabase, AntiSpamDatabase, GlobalChatDatabase, LevelDatabase, LoggingDatabase
        
        # Check Level System
        try:
            lvl_conf = LevelDatabase().get_guild_config(guild_id)
            level_active = lvl_conf.get("enabled", True) if lvl_conf else False
        except:
            level_active = False

        # Check AntiSpam
        try:
            spam_conf = AntiSpamDatabase().get_spam_settings(guild_id)
            antispam_active = bool(spam_conf)
        except:
            antispam_active = False

        # Check Welcome
        try:
            welcome_conf = await WelcomeDatabase().get_welcome_settings(guild_id)
            welcome_active = bool(welcome_conf and welcome_conf.get("channel_id"))
        except:
            welcome_active = False

        # Check GlobalChat
        try:
            global_conf = GlobalChatDatabase().get_guild_settings(guild_id)
            global_active = bool(global_conf and global_conf.get("channel_id"))
        except:
            global_active = False

        # Check Logging
        try:
            log_conf = await LoggingDatabase().get_all_log_channels(guild_id)
            logging_active = len(log_conf) > 0 if log_conf else False
        except:
            logging_active = False

        guild_lang = "de"

        # 3. Fetch Metadata
        channels = [{"id": str(c.id), "name": c.name} for c in guild.text_channels]
        roles = [
            {"id": str(r.id), "name": r.name, "color": str(r.color)}
            for r in guild.roles
            if not r.is_default() and not r.managed
        ]
        categories = [{"id": str(c.id), "name": c.name} for c in guild.categories]
        voice_channels = [{"id": str(c.id), "name": c.name} for c in guild.voice_channels]

        return {
            "success": True,
            "data": {
                "settings": {
                    "bot_name": bot_instance.user.name,
                    "prefix": "!",
                    "auto_mod": antispam_active,
                    "welcome_message": welcome_active,
                    "language": guild_lang,
                    "level_system": level_active,
                    "anti_spam": antispam_active,
                    "global_network": global_active,
                    "logging": logging_active,
                    "economy": False
                },
                "stats": stats,
                "metadata": {
                    "channels": channels,
                    "roles": roles,
                    "categories": categories,
                    "voice_channels": voice_channels
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

dashboard_main_router.include_router(auth_router)
dashboard_main_router.include_router(settings_router)
dashboard_main_router.include_router(user_router)
# dashboard_main_router.include_router(router_public) # Move to main.py for root access

