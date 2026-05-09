import discord
from discord.ext import commands
from mxmariadb.cms_db import CMSDatabase

class FeedbackModal(discord.ui.Modal):
    def __init__(self, feedback_type: str, db: CMSDatabase):
        super().__init__(title="🐛 Bug melden" if feedback_type == 'bug' else "💡 Vorschlag einreichen")
        self.feedback_type = feedback_type
        self.db = db

        self.content = discord.ui.InputText(
            label="Beschreibe dein Anliegen",
            style=discord.InputTextStyle.paragraph,
            placeholder="Was möchtest du uns mitteilen? Bitte so genau wie möglich.",
            required=True,
            max_length=2000
        )
        self.add_item(self.content)

    async def callback(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        try:
            await self.db.create_feedback(
                type=self.feedback_type,
                content=self.content.value,
                user_id=str(interaction.user.id),
                user_name=str(interaction.user),
                guild_id=str(interaction.guild.id) if interaction.guild else None
            )
            embed = discord.Embed(
                title="✅ Vielen Dank!",
                description="Dein Feedback wurde erfolgreich an unser CMS-System übermittelt. Wir schauen uns das bald an!",
                color=discord.Color.green()
            )
            await interaction.followup.send(embed=embed, ephemeral=True)
        except Exception as e:
            embed = discord.Embed(
                title="❌ Fehler",
                description="Es gab ein Problem beim Speichern deines Feedbacks. Bitte versuche es später erneut.",
                color=discord.Color.red()
            )
            await interaction.followup.send(embed=embed, ephemeral=True)

class FeedbackCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db = CMSDatabase()

    @discord.slash_command(name="suggest", description="💡 Sende einen Vorschlag oder eine Idee für den Bot ein.")
    async def suggest(self, ctx: discord.ApplicationContext):
        await ctx.send_modal(FeedbackModal('suggestion', self.db))

    @discord.slash_command(name="bug", description="🐛 Melde einen Fehler oder Bug im Bot.")
    async def bug(self, ctx: discord.ApplicationContext):
        await ctx.send_modal(FeedbackModal('bug', self.db))

def setup(bot):
    bot.add_cog(FeedbackCog(bot))
