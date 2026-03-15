from fastapi import APIRouter, Request, HTTPException, Security, status, Depends
from fastapi.security import APIKeyHeader
import os
import discord
from src.api.dashboard.auth_routes import get_current_user
from typing import List, Optional
from datetime import datetime
import time
# Falls du Schemas nutzt: from .schemas import ServerStatus, UserInfo

from .auth_routes import router as auth_router
from .settings_routes import router as settings_router

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
        # Berechne Uptime (in Sekunden seit dem letzten Ready-Event)
        uptime_seconds = (datetime.utcnow() - bot_instance.start_time).total_seconds() if hasattr(bot_instance, 'start_time') else 0
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

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

# Public sub-routers (no global X-API-KEY required, they manage their own like JWT)
@router.get("/guilds/{guild_id}/channels")
async def get_guild_channels(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches text channels for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    # Check if user is in guild and has appropriate permissions (Manage Guild or Admin)
    member = guild.get_member(int(user["id"]))
    if not member or not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    channels = [
        {"id": str(c.id), "name": c.name}
        for c in guild.text_channels
    ]
    return {"channels": channels}

@router.get("/guilds/{guild_id}/roles")
async def get_guild_roles(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches manageable roles for a specific guild."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member or not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    roles = [
        {"id": str(r.id), "name": r.name, "color": str(r.color)}
        for r in guild.roles if not r.is_default() and not r.managed
    ]
    return {"roles": roles}

@router.get("/guilds/{guild_id}/stats")
async def get_guild_stats(guild_id: int, user: dict = Depends(get_current_user)):
    """Fetches server statistics (Daily joins, message count, member total)."""
    if bot_instance is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot_instance.get_guild(guild_id)
    if not guild:
         raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(int(user["id"]))
    if not member or not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Fetch daily growth/activity
    today_str = datetime.now().strftime('%Y-%m-%d')
    joined_today = 0
    messages_today = 0
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
        
        if hasattr(bot_instance, 'stats_db'):
            messages_today = await bot_instance.stats_db.get_daily_messages(guild_id, today_str)
            stats_history = await bot_instance.stats_db.get_weekly_stats(guild_id)

        # 2. Combine history for the last 7 days
        for i in range(6, -1, -1):
            date_obj = datetime.now() - timedelta(days=i)
            d_str = date_obj.strftime('%Y-%m-%d')
            day_name = date_obj.strftime('%a')
            
            m_count = 0
            j_count = 0
            
            # Find in pre-fetched histories
            for h in stats_history:
                if h['date'] == d_str:
                    m_count = h['messages']
                    break
            
            for h in welcome_history:
                if h['date'] == d_str:
                    j_count = h['joins']
                    break
            
            history.append({
                "name": day_name,
                "messages": m_count,
                "joins": j_count
            })

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
            "messages_today": messages_today,
            "history": history
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

router.include_router(auth_router)
router.include_router(settings_router)
router.include_router(router_public)

