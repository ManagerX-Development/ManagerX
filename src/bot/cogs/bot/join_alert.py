import discord
from discord.ui import Container, DesignerView
import ezcord

class JoinAlert(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        # 1. Infos über die neue Guild sammeln
        owner = guild.owner.display_name if guild.owner else "Unbekannt"
        member_count = guild.member_count
        
        # 2. Den Py-cord Container für dein Team-Log bauen
        container = Container()
        container.add_text(f"## 📥 Neuer Server!")
        container.add_separator()
        container.add_text(f"**Name:** {guild.name}")
        container.add_text(f"**Owner:** {owner}")
        container.add_text(f"**Member:** {member_count}")
        
        # 3. Den Alert senden
        # TIPP: Ersetze LOG_CHANNEL_ID mit der ID deines eigenen Support-Servers
        log_channel_id = 1429163147687886889  
        log_channel = self.bot.get_channel(log_channel_id)

        if log_channel:
            view = DesignerView(container, timeout=None)
            await log_channel.send(view=view)
        
        # Optionale Konsolen-Ausgabe (für den Developer-Vibe)
        print(f"[+] Bot ist neu auf: {guild.name}")

def setup(bot):
    bot.add_cog(JoinAlert(bot))