import discord
from discord.ui import Container, DesignerView
import ezcord

class LeaveAlert(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Dein Log-Kanal für Abgänge
        self.log_channel_id = 1429164270435700849 

    @discord.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        # Wir berechnen den neuen Serverstand direkt
        total_servers = len(self.bot.guilds)
        
        # Container in Rot für den Abschied
        container = Container(color=discord.Color.from_rgb(255, 0, 0)) # Sattes Rot
        container.add_text("## 📤 Bot hat einen Server verlassen")
        container.add_separator()
        
        guild_name = guild.name if guild.name else "Unbekannter Server"
        
        # Schickere Formatierung mit Emojis und Backticks
        info_text = (
            f"**🏠 Server:** `{guild_name}`\n"
            f"**🆔 ID:** `{guild.id}`\n"
        )
        
        if guild.member_count:
            info_text += f"**👥 Letzte Mitgliederzahl:** `{guild.member_count}`\n"
            
        info_text += f"**📊 Neue Gesamtanzahl:** `{total_servers}`"
        
        container.add_text(info_text)

        # Versuchen, das Icon noch zu kriegen (manchmal klappt's noch kurz nach dem Leave)
        if guild.icon:
            container.set_thumbnail(guild.icon.url)

        log_channel = self.bot.get_channel(self.log_channel_id)
        if log_channel:
            view = DesignerView(container, timeout=None)
            await log_channel.send(view=view)
        
        print(f"[-] Bot verlassen: {guild_name} | Server verbleibend: {total_servers}")

def setup(bot):
    bot.add_cog(LeaveAlert(bot))