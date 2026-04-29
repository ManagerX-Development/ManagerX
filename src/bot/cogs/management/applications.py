# Copyright (c) 2026 ManagerX Development
# ───────────────────────────────────────────────
# >> Imports
# ───────────────────────────────────────────────
import discord
import ezcord
from discord import slash_command, Option
from discord.ui import Container, DesignerView, Button, View
from mxmariadb import ManagementDatabase
import logging
import asyncio

db = ManagementDatabase()
logger = logging.getLogger(__name__)

# --- Database Extension for Settings ---
# Note: I'll add a simple setting fetcher for the log channel
async def get_app_log_channel(guild_id: int):
    # For now, we'll use a simple approach or add it to the DB if not exists
    # Alternatively, we just use the current channel if none is set.
    return None 

class ApplicationActionButtons(View):
    """View with Accept/Decline buttons for Admins."""
    def __init__(self, user_id: int):
        super().__init__(timeout=None)
        self.user_id = user_id

    @discord.ui.button(label="Annehmen", style=discord.ButtonStyle.success, emoji="✅", custom_id="app_accept")
    async def accept(self, button: Button, interaction: discord.Interaction):
        user = await interaction.client.fetch_user(self.user_id)
        if user:
            try:
                await user.send(f"🎉 **Deine Bewerbung auf {interaction.guild.name} wurde angenommen!** Ein Teammitglied wird sich in Kürze bei dir melden.")
            except: pass
        
        await interaction.response.edit_message(content=f"✅ **Bewerbung von <@{self.user_id}> angenommen durch {interaction.user.mention}**", view=None)

    @discord.ui.button(label="Ablehnen", style=discord.ButtonStyle.danger, emoji="❌", custom_id="app_deny")
    async def deny(self, button: Button, interaction: discord.Interaction):
        user = await interaction.client.fetch_user(self.user_id)
        if user:
            try:
                await user.send(f"❌ **Deine Bewerbung auf {interaction.guild.name} wurde leider abgelehnt.** Trotzdem danke für dein Interesse!")
            except: pass
            
        await interaction.response.edit_message(content=f"❌ **Bewerbung von <@{self.user_id}> abgelehnt durch {interaction.user.mention}**", view=None)

class ApplicationStartButton(View):
    """The initial 'Bewerben' button view."""
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Bewerben", style=discord.ButtonStyle.success, emoji="📩", custom_id="start_app")
    async def start_app(self, button: Button, interaction: discord.Interaction):
        await db.ensure_connection() # Tabellen sicher erstellen
        questions = await db.get_questions(interaction.guild.id)
        if not questions:
            return await interaction.response.send_message("❌ Bewerbungen sind derzeit nicht konfiguriert.", ephemeral=True)

        await interaction.response.send_message("📩 Ich habe dir eine Direktnachricht geschickt!", ephemeral=True)
        
        try:
            answers = []
            dm_channel = await interaction.user.create_dm()
            
            for q in questions:
                container = Container(color=discord.Color.blue())
                container.add_text(f"### 📝 Frage: {q['question_text']}")
                container.add_text("*Bitte schreibe deine Antwort in den Chat.*")
                
                await dm_channel.send(view=DesignerView(container, timeout=0))
                
                def check(m):
                    return m.author == interaction.user and m.channel == dm_channel
                
                try:
                    msg = await interaction.client.wait_for('message', check=check, timeout=600.0)
                    answers.append((q['question_text'], msg.content))
                except asyncio.TimeoutError:
                    return await dm_channel.send("⏰ Zeit abgelaufen. Deine Bewerbung wurde abgebrochen.")

            await dm_channel.send("✅ Deine Bewerbung wurde erfolgreich eingereicht!")
            
            # Send to Admins
            container = Container(color=discord.Color.gold())
            container.add_text(f"## 📩 Neue Bewerbung von {interaction.user}")
            container.add_text(f"User ID: `{interaction.user.id}` | Erwähnung: {interaction.user.mention}")
            container.add_separator()
            
            for q_text, ans_text in answers:
                container.add_text(f"**{q_text}**\n> {ans_text}")
                container.add_separator()
            
            admin_view = DesignerView(container, timeout=None)
            # Add the persistent action buttons
            admin_action_view = ApplicationActionButtons(interaction.user.id)
            
            # Log it! (In a real system, we'd use a channel ID from DB)
            target_channel = interaction.channel
            await target_channel.send(view=admin_view)
            await target_channel.send(view=admin_action_view)
            
        except discord.Forbidden:
            await interaction.followup.send("❌ Ich kann dir keine DM schicken!", ephemeral=True)

class Applications(ezcord.Cog):
    """Fully functional Application system with Interactive Buttons."""

    def __init__(self, bot):
        self.bot = bot

    @ezcord.Cog.listener()
    async def on_ready(self):
        await db.ensure_connection()
        self.bot.add_view(ApplicationStartButton()) # Register initial button

    app = discord.SlashCommandGroup("application", "Verwalte das Bewerbungssystem")

    @app.command(name="setup-questions", description="Setzt die Fragen für das System (kommagetrennt)")
    async def setup_questions(self, ctx: discord.ApplicationContext, questions: str):
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Berechtigung fehlt.", ephemeral=True)

        await db.clear_questions(ctx.guild.id)
        q_list = [q.strip() for q in questions.split(",")]
        
        for i, q_text in enumerate(q_list):
            await db.add_question(ctx.guild.id, q_text, i)
            
        await ctx.respond(f"✅ {len(q_list)} Fragen gespeichert!", ephemeral=True)

    @app.command(name="post", description="Postet das Bewerbungs-Embed mit Button")
    async def post_app(self, ctx: discord.ApplicationContext):
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Berechtigung fehlt.", ephemeral=True)

        container = Container(color=discord.Color.green())
        container.add_text("## 📩 Team-Bewerbung")
        container.add_text("Klicke auf den Button unten, um den Prozess zu starten.")
        
        await ctx.channel.send(view=ApplicationStartButton())
        await ctx.respond("✅ Bewerbungsposten erstellt!", ephemeral=True)

def setup(bot):
    bot.add_cog(Applications(bot))
