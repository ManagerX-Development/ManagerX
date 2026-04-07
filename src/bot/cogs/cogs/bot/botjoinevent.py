import discord
from discord.ui import Container  # Dein ezcord/discord.ui Import
import ezcord

class BotJoinEvents(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @ezcord.Cog.listener()
    async def on_guild_join(self, guild):
        # Den Serverbesitzer schnappen
        owner = guild.owner
        
        if owner:
            # Container erstellen (Passend zu deinem Branding in Rot)
            container = Container(color=discord.Color.red())
            
            # Content im Container-Style aufbauen
            container.add_text(f"# 👋 Hello! I am {self.bot.user.name}")
            container.add_text(
                f"Thanks for inviting me to **{guild.name}**! I'm here to support you with "
                "**Moderation, Global Chat, and Economy**."
            )
            
            container.add_separator()
            
            container.add_text("### 🏆 Current Season")
            container.add_text("Check out the global leaderboard using `/stats`!")
            
            container.add_text("### 🛠️ Setup")
            container.add_text("Use `/help` to configure my settings.")

            container.add_separator()

            container.add_text("### 🔗 Links")
            container.add_text("🔗 [Website](https://managerx-bot.de) × [Top.gg](https://top.gg/bot/1368201272624287754) × [Support](https://discord.gg/9T28DWup3g) × [GitHub](https://github.com/ManagerX-Development/ManagerX)")
            
            # Die DesignerView für den Container erstellen
            view = discord.ui.DesignerView(container, timeout=0)

            try:
                # Den modernen Container per DM an den Owner senden
                await owner.send(view=view)
            except discord.Forbidden:
                # Falls DMs beim Owner zu sind
                pass
            except Exception as e:
                print(f"Error sending Container-DM: {e}")

def setup(bot):
    bot.add_cog(BotJoinEvents(bot))