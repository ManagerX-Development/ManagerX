from fastapi import APIRouter, Request, HTTPException, Depends
from datetime import timedelta
import discord
from src.api.dashboard.auth_routes import get_current_user

router = APIRouter(
    prefix="/guilds",
    tags=["guilds"]
)

def get_bot():
    from .routes import bot_instance
    return bot_instance

async def check_guild_perms(guild_id: int, user_id: int):
    bot = get_bot()
    if bot is None:
        raise HTTPException(status_code=503, detail="Bot-Verbindung nicht verfügbar")
    
    guild = bot.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found or bot not in guild")
    
    member = guild.get_member(user_id)
    if not member:
        try:
            member = await guild.fetch_member(user_id)
        except:
            raise HTTPException(status_code=403, detail="Nutzer nicht auf dem Server gefunden")

    if not (member.guild_permissions.manage_guild or member.guild_permissions.administrator):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return guild, member

@router.get("/{guild_id}/channels")
async def get_guild_channels(guild_id: int, user: dict = Depends(get_current_user)):
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))
    channels = [{"id": str(c.id), "name": c.name} for c in guild.text_channels]
    return {"channels": channels}

@router.get("/{guild_id}/roles")
async def get_guild_roles(guild_id: int, user: dict = Depends(get_current_user)):
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))
    roles = [
        {"id": str(r.id), "name": r.name, "color": str(r.color)}
        for r in guild.roles
        if not r.is_default() and not r.managed
    ]
    return {"roles": roles}

@router.get("/{guild_id}/categories")
async def get_guild_categories(guild_id: int, user: dict = Depends(get_current_user)):
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))
    categories = [{"id": str(c.id), "name": c.name} for c in guild.categories]
    return {"categories": categories}

@router.get("/{guild_id}/voice_channels")
async def get_guild_voice_channels(guild_id: int, user: dict = Depends(get_current_user)):
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))
    channels = [{"id": str(c.id), "name": c.name} for c in guild.voice_channels]
    return {"channels": channels}

@router.get("/{guild_id}/stats")
async def get_guild_stats(guild_id: int, user: dict = Depends(get_current_user)):
    bot = get_bot()
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))

    today_dt = discord.utils.utcnow()
    today_str = today_dt.strftime('%Y-%m-%d')
    yesterday_str = (today_dt - timedelta(days=1)).strftime('%Y-%m-%d')
    joined_today = 0
    joined_yesterday = 0
    messages_today = 0
    messages_yesterday = 0
    history = []

    try:
        welcome_history = []
        stats_history = []
        
        if hasattr(bot, 'welcome_db'):
            welcome_history = await bot.welcome_db.get_weekly_stats(guild_id)
            for day in welcome_history:
                if day['date'] == today_str: joined_today = day['joins']
                elif day['date'] == yesterday_str: joined_yesterday = day['joins']
        
        if hasattr(bot, 'stats_db'):
            messages_today = await bot.stats_db.get_daily_messages(guild_id, today_str)
            messages_yesterday = await bot.stats_db.get_daily_messages(guild_id, yesterday_str)
            stats_history = await bot.stats_db.get_weekly_stats(guild_id)

        for i in range(6, -1, -1):
            date_obj = today_dt - timedelta(days=i)
            d_str = date_obj.strftime('%Y-%m-%d')
            day_name = date_obj.strftime('%a')
            m_count = next((h['messages'] for h in stats_history if h['date'] == d_str), 0)
            j_count = next((h['joins'] for h in welcome_history if h['date'] == d_str), 0)
            history.append({"name": day_name, "messages": m_count, "joins": j_count})

        def calc_trend(today, yesterday):
            if today == yesterday: return "neutral", "0%"
            if yesterday == 0: return "up", "+100%"
            diff = today - yesterday
            pct = round((abs(diff) / yesterday) * 100)
            return ("up" if diff > 0 else "down"), f"{'+' if diff > 0 else '-'}{pct}%"

        m_trend, m_trend_val = calc_trend(messages_today, messages_yesterday)
        j_trend, j_trend_val = calc_trend(joined_today, joined_yesterday)

        server_age_str = f"{(today_dt - guild.created_at).days}d"
        staff_list = []
        user_list = []
        
        if hasattr(bot, 'settings_db'):
            gs = bot.settings_db.get_guild_settings(guild_id)
            if tid := gs.get("team_role_id"):
                if tr := guild.get_role(int(tid)):
                    staff_list = [{"name": m.display_name, "id": str(m.id), "avatar": m.display_avatar.url} for m in tr.members]
            if uid := gs.get("user_role_id"):
                if ur := guild.get_role(int(uid)):
                    user_list = [{"name": m.display_name, "id": str(m.id), "avatar": m.display_avatar.url} for m in ur.members]

        total_members = guild.member_count or len(guild.members)
        online_members = sum(1 for m in guild.members if m.status != discord.Status.offline) if guild.members else 0
        
        return {
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
            "staff_members": staff_list,
            "user_members": user_list
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {"total_members": guild.member_count, "online_members": 0}

@router.get("/{guild_id}/mega-data")
async def get_mega_data(guild_id: int, user: dict = Depends(get_current_user)):
    bot = get_bot()
    guild, _ = await check_guild_perms(guild_id, int(user["id"]))

    try:
        stats = await get_guild_stats(guild_id, user)
        from mxmariadb import WelcomeDatabase, AntiSpamDatabase, GlobalChatDatabase, LevelDatabase, LoggingDatabase, ManagementDatabase
        
        level_active = LevelDatabase().get_guild_config(guild_id).get("enabled", False) if LevelDatabase().get_guild_config(guild_id) else False
        antispam_active = bool(AntiSpamDatabase().get_spam_settings(guild_id))
        welcome_active = bool(await WelcomeDatabase().get_welcome_settings(guild_id))
        global_active = bool(GlobalChatDatabase().get_guild_settings(guild_id))
        logging_active = bool(await LoggingDatabase().get_all_log_channels(guild_id))

        db_m = ManagementDatabase()
        await db_m.ensure_connection()
        autoresponder_active = len(await db_m.get_auto_responses(guild_id)) > 0
        applications_active = len(await db_m.get_questions(guild_id)) > 0
        newssync_active = any(c['guild_id'] == guild_id for c in await db_m.get_sync_channels())

        return {
            "success": True,
            "data": {
                "settings": {
                    "bot_name": bot.user.name,
                    "prefix": "!",
                    "auto_mod": antispam_active,
                    "welcome_message": welcome_active,
                    "language": "de",
                    "level_system": level_active,
                    "anti_spam": antispam_active,
                    "global_network": global_active,
                    "logging": logging_active,
                    "auto_responder": autoresponder_active,
                    "applications": applications_active,
                    "news_sync": newssync_active,
                    "economy": False
                },
                "stats": stats,
                "metadata": {
                    "channels": [{"id": str(c.id), "name": c.name} for c in guild.text_channels],
                    "roles": [{"id": str(r.id), "name": r.name, "color": str(r.color)} for r in guild.roles if not r.is_default() and not r.managed],
                    "categories": [{"id": str(c.id), "name": c.name} for c in guild.categories],
                    "voice_channels": [{"id": str(c.id), "name": c.name} for c in guild.voice_channels]
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
