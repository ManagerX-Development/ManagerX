# Copyright (c) 2026 ManagerX Development
# ───────────────────────────────────────────────
# >> Imports
# ───────────────────────────────────────────────
import discord
import ezcord
from discord import slash_command, Option
from discord.ui import Container, DesignerView
from mxmariadb import ManagementDatabase
import logging

db = ManagementDatabase()
logger = logging.getLogger(__name__)

class AutoResponder(ezcord.Cog):
    """Self-configurable Keyword-Responder using Container UI."""

    def __init__(self, bot):
        self.bot = bot

    @ezcord.Cog.listener()
    async def on_ready(self):
        await db.ensure_connection()
        logger.info("AutoResponder DB connection ensured.")

    @ezcord.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        await db.ensure_connection() # Sicherstellen, dass Tabellen existieren
        
        try:
            # Fetch responses for this guild
            responses = await db.get_auto_responses(message.guild.id)
            if not responses:
                return

            content_lower = message.content.lower()

            for res in responses:
                keyword = res['keyword'].lower()
                response_text = res['response']
                match_type = res['match_type']
                res_id = res['id']
                
                should_respond = False
                
                if match_type == 'exact':
                    if content_lower == keyword:
                        should_respond = True
                else: # partial
                    if keyword in content_lower:
                        should_respond = True
                
                if should_respond:
                    # Build Container Response
                    container = Container(color=discord.Color.blue())
                    container.add_text(f"### 🤖 Automatische Antwort: `{keyword.upper()}`")
                    container.add_text(response_text)
                    container.add_separator()
                    container.add_text(f"*Diese Nachricht wurde automatisch basierend auf deinem Keyword gesendet.*")
                    
                    view = DesignerView(container, timeout=0)
                    await message.channel.send(view=view, reference=message)
                    break 
        except Exception as e:
            logger.error(f"Error in AutoResponder on_message: {e}")

    # --- Commands ---
    auto_respond = discord.SlashCommandGroup("autoresponder", "Verwalte den Auto-Responder")

    @auto_respond.command(name="add", description="Fügt ein neues Keyword hinzu")
    async def add_keyword(
        self, 
        ctx: discord.ApplicationContext,
        keyword: Option(str, "Das Wort, auf das der Bot reagieren soll", required=True),
        response: Option(str, "Die Antwort des Bots", required=True),
        match_type: Option(str, "Wie soll das Wort erkannt werden?", choices=["Teilweise", "Exakt"], default="Teilweise")
    ):
        await db.ensure_connection()
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Du benötigst die Berechtigung **Server verwalten**!", ephemeral=True)

        m_type = "partial" if match_type == "Teilweise" else "exact"
        await db.add_auto_response(ctx.guild.id, keyword, response, m_type)
        
        await ctx.respond(f"✅ Keyword `{keyword}` wurde hinzugefügt!\nModus: **{match_type}**", ephemeral=True)

    @auto_respond.command(name="list", description="Zeigt alle Keywords an")
    async def list_keywords(self, ctx: discord.ApplicationContext):
        responses = await db.get_auto_responses(ctx.guild.id)
        if not responses:
            return await ctx.respond("❌ Keine Keywords eingerichtet.", ephemeral=True)

        container = Container()
        container.add_text("## 🤖 Eingerichtete Keywords")
        
        for res in responses:
            container.add_text(f"ID: `{res['id']}` | **{res['keyword']}** ({res['match_type']})\n> {res['response'][:50]}...")
            container.add_separator()
            
        view = DesignerView(container, timeout=None)
        await ctx.respond(view=view, ephemeral=True)

    @auto_respond.command(name="remove", description="Entfernt ein Keyword per ID")
    async def remove_keyword(self, ctx: discord.ApplicationContext, id: int):
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Du benötigst die Berechtigung **Server verwalten**!", ephemeral=True)

        await db.remove_auto_response(ctx.guild.id, id)
        await ctx.respond(f"✅ Keyword mit ID `{id}` wurde entfernt.", ephemeral=True)

def setup(bot):
    bot.add_cog(AutoResponder(bot))
