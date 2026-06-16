from fastapi import APIRouter, HTTPException, Depends
from mxmariadb import ManagementDatabase
import discord
from datetime import datetime

from .dependencies import get_current_user, get_bot
from .schemas import AutoResponderAddRequest, ApplicationQuestionsUpdate

router = APIRouter(
    prefix="/management",
    tags=["management"],
    dependencies=[Depends(get_current_user)]
)

async def send_management_notification(bot, guild_id: int, module_name: str, user_name: str):
    """Helper for dashboard notifications."""
    if not bot: return
    guild = bot.get_guild(guild_id)
    if not guild: return
    
    target_channel = guild.system_channel or guild.text_channels[0]
    if not target_channel: return

    embed = discord.Embed(
        title="🛠️ Management-Settings aktualisiert",
        description=f"Das Modul **{module_name}** wurde über das Dashboard angepasst.",
        color=discord.Color.gold(),
        timestamp=datetime.now()
    )
    embed.add_field(name="Administrator", value=user_name, inline=True)
    embed.set_footer(text="ManagerX Dashboard System")
    try: await target_channel.send(embed=embed)
    except: pass

# --- Auto-Responder ---
@router.get("/{guild_id}/autoresponder")
async def get_autoresponder(guild_id: int):
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        data = await db.get_auto_responses(guild_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{guild_id}/autoresponder")
async def add_autoresponder(guild_id: int, data: AutoResponderAddRequest, user: dict = Depends(get_current_user), bot = Depends(get_bot)):
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        await db.add_auto_response(
            guild_id, 
            data.keyword, 
            data.response, 
            data.match_type
        )
        await send_management_notification(bot, guild_id, "Auto-Responder", user.get("username"))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{guild_id}/autoresponder/{responder_id}")
async def delete_autoresponder(guild_id: int, responder_id: int):
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        await db.remove_auto_response(guild_id, responder_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- News-Sync ---
@router.get("/{guild_id}/newssync")
async def get_newssync(guild_id: int):
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        all_channels = await db.get_sync_channels()
        guild_syncs = [c for c in all_channels if c['guild_id'] == guild_id]
        return {"success": True, "data": guild_syncs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Applications ---
@router.get("/{guild_id}/applications")
async def get_app_questions(guild_id: int):
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        questions = await db.get_questions(guild_id)
        return {"success": True, "data": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{guild_id}/applications")
async def set_app_questions(guild_id: int, data: ApplicationQuestionsUpdate, user: dict = Depends(get_current_user), bot = Depends(get_bot)):
    questions = data.questions
    db = ManagementDatabase()
    try:
        await db.ensure_connection()
        await db.clear_questions(guild_id)
        for i, q_text in enumerate(questions):
            await db.add_question(guild_id, q_text, i)
        await send_management_notification(bot, guild_id, "Bewerbungssystem", user.get("username"))
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
