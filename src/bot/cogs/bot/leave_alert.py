import discord
from discord.ui import Container, DesignerView
import ezcord

class LeaveAlert(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        # ID deines Kanals, in den die Info fließen soll
        self.log_channel_id = 1429164270435700849 

    @discord.Cog.listener()
    async def on_guild_remove(self, guild: discord.Guild):
        # Container für den Abschied bauen
        container = Container(color=discord.Color.red())
        container.add_text("## 📤 Bot wurde entfernt")
        container.add_separator()
        
        # Falls der Name nicht mehr greifbar ist (selten), nutzen wir die ID
        guild_name = guild.name if guild.name else "Unbekannter Server"
        
        container.add_text(f"**Server:** {guild_name}")
        container.add_text(f"**ID:** {guild.id}")
        
        # Da wir weg sind, wissen wir nicht genau, wie viele Member es zuletzt waren,
        # aber wir können versuchen, den letzten Stand auszugeben
        if guild.member_count:
            container.add_text(f"**Letzter Stand:** {guild.member_count} Mitglieder")

        log_channel = self.bot.get_channel(self.log_channel_id)
        if log_channel:
            view = DesignerView(container, timeout=None)
            await log_channel.send(view=view)
        
        print(f"[-] Bot hat den Server verlassen: {guild_name} ({guild.id})")

def setup(bot):
    bot.add_cog(LeaveAlert(bot))