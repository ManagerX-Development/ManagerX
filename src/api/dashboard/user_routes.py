from fastapi import APIRouter, Request, HTTPException, Depends
from src.api.dashboard.auth_routes import get_current_user
from mx_devtools import SettingsDB, StatsDB, EconomyDatabase
import discord
import sqlite3
import os
from pathlib import Path

# Paths to databases
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MOD_DIR = BASE_DIR / "src" / "bot" / "cogs" / "moderation"


router = APIRouter(
    prefix="/user",
    tags=["user"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/settings")
async def get_user_settings(user: dict = Depends(get_current_user)):
    """Fetch user settings from SettingsDB."""
    from src.api.dashboard.routes import bot_instance
    settings_db = SettingsDB()
    try:
        user_id = int(user["id"])
        
        # Get language setting from SettingsDB
        language = settings_db.get_user_language(user_id)
        
        # Get global stats from StatsDB
        stats_db = StatsDB()
        global_info = await stats_db.get_global_user_info(user_id)
        
        # 1. Moderation Stats (Global Warnings)
        warns_count = 0
        warns_db_path = MOD_DIR / "Datenbanken" / "warns.db"
        if warns_db_path.exists():
            try:
                conn = sqlite3.connect(warns_db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM warns WHERE user_id = ?", (user_id,))
                warns_count = cursor.fetchone()[0]
                conn.close()
            except Exception:
                pass
                
        # 2. Global Chat Stats
        global_chat_messages = 0
        gc_db_path = DATA_DIR / "globalchat.db"
        if gc_db_path.exists():
            try:
                conn = sqlite3.connect(gc_db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM message_log WHERE user_id = ?", (user_id,))
                global_chat_messages = cursor.fetchone()[0]
                conn.close()
            except Exception:
                pass
                
        # 3. Top Servers (from LevelSystem)
        top_servers = []
        ls_db_path = DATA_DIR / "levelsystem.db"
        if ls_db_path.exists():
            try:
                conn = sqlite3.connect(ls_db_path)
                cursor = conn.cursor()
                # Get top 3 guilds by XP for this user
                cursor.execute("""
                    SELECT guild_id, level, xp 
                    FROM user_levels 
                    WHERE user_id = ? 
                    ORDER BY xp DESC 
                    LIMIT 3
                """, (user_id,))
                rows = cursor.fetchall()
                for row in rows:
                    guild_id = row[0]
                    guild_name = "Unknown Server"
                    guild_icon = None
                    
                    if bot_instance:
                        guild = bot_instance.get_guild(guild_id)
                        if guild:
                            guild_name = guild.name
                            guild_icon = guild.icon.url if guild.icon else None
                            
                    top_servers.append({
                        "guild_id": str(guild_id),
                        "name": guild_name,
                        "icon_url": guild_icon,
                        "level": row[1],
                        "xp": row[2]
                    })
                conn.close()
            except Exception:
                pass

        return {
            "success": True, 
            "data": {
                "user_id": str(user_id),
                "language": language,
                "username": user.get("username", "Unknown"),
                "global_stats": global_info,
                "moderation": {
                    "total_warnings": warns_count
                },
                "global_chat": {
                    "total_messages": global_chat_messages
                },
                "economy": {
                    "global_coins": EconomyDatabase().get_global_balance(user_id),
                    "overrides": EconomyDatabase().get_equipped_overrides(user_id)
                },
                "top_servers": top_servers,
                "is_private": global_info.get('is_private', 0) if global_info else 0
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
            
        # Update privacy in StatsDB if provided
        if "is_private" in data:
            stats_db = StatsDB()
            async with stats_db.lock:
                stats_db.cursor.execute(
                    "UPDATE global_user_levels SET is_private = ? WHERE user_id = ?", 
                    (1 if data["is_private"] else 0, user_id)
                )
                stats_db.conn.commit()
                
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")
