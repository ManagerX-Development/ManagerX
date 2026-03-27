import discord
from discord.ui import Container, DesignerView
import ezcord

class JoinAlert(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild):
        owner = guild.owner.display_name if guild.owner else "Unbekannt"
        member_count = guild.member_count
        # Hier nutzen wir len(), um die Anzahl der Server als Zahl zu bekommen
        total_servers = len(self.bot.guilds)

        # Container erstellen mit einer coolen Farbe
        container = Container(color=discord.Color.brand_green())
        container.add_text(f"## 📥 Neuer Server beigetreten!")
        container.add_separator()
        
        # Die Infos schön untereinander mit Emojis
        container.add_text(
            f"**🏠 Name:** `{guild.name}`\n"
            f"**👑 Owner:** `{owner}`\n"
            f"**👥 Mitglieder:** `{member_count}`\n"
            f"**🆔 ID:** `{guild.id}`\n"
            f"**📊 Gesamtanzahl Server:** `{total_servers}`"
        )

        # Die Channel-ID von dir
        log_channel_id = 1429163147687886889  
        log_channel = self.bot.get_channel(log_channel_id)

        if log_channel:
            # Die DesignerView macht das Ganze im Discord-Chat hübsch
            view = DesignerView(container, timeout=None)
            await log_channel.send(view=view)
        
        print(f"[+] Bot ist neu auf: {guild.name} (Server jetzt: {total_servers})") 

def setup(bot):
    bot.add_cog(JoinAlert(bot))