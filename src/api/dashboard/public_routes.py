from fastapi import APIRouter, Request, HTTPException
import discord
from typing import List, Optional

router = APIRouter(
    prefix="/v1/managerx",
    tags=["public"]
)

def get_bot():
    from .routes import bot_instance
    return bot_instance

@router.get("/stats")
async def get_stats(request: Request):
    bot = get_bot()
    if bot is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    try:
        now = discord.utils.utcnow()
        start = getattr(bot, 'start_time', now)
        if start.tzinfo is None: start = start.replace(tzinfo=discord.utils.timezone.utc)
             
        uptime_seconds = (now - start).total_seconds()
        uptime_minutes, remainder = divmod(int(uptime_seconds), 60)
        uptime_hours, uptime_minutes = divmod(uptime_minutes, 60)
        uptime_days, uptime_hours = divmod(uptime_hours, 24)
        
        return {
            "uptime": f"{int(uptime_days)}d {int(uptime_hours)}h {int(uptime_minutes)}m",
            "latency": f"{round(bot.latency * 1000)}ms",
            "guilds": len(bot.guilds),
            "users": len(bot.users),
            "bot_name": bot.user.name if bot.user else "Unknown",
            "bot_id": bot.user.id if bot.user else None,
            "status": "online",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    from mxmariadb import StatsDB
    bot = get_bot()
    if bot is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    try:
        stats_db = StatsDB()
        rows = await stats_db.get_leaderboard(limit=limit)
        leaderboard = []
        for row in rows:
            uid = row[0]
            is_private = row[5] if len(row) > 5 else 0
            if is_private:
                username, avatar = "Anonymer Nutzer", None
            else:
                user = bot.get_user(uid)
                username = user.name if user else f"User {uid}"
                avatar = user.display_avatar.url if user else None
            
            leaderboard.append({
                "user_id": str(uid), "username": username, "avatar_url": avatar,
                "level": row[1], "xp": row[2], "messages": row[3],
                "voice_minutes": round(row[4], 1)
            })
        return {"success": True, "leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/version")
async def get_version():
    return {"pypi_version": "1.2026.5.7", "bot_version": "v2.1.0-open-beta"}
