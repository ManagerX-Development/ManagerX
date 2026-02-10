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
        

        container = Container(color=discord.Color.green())
        container.add_text(f"## 📥 Neuer Server!")
        container.add_separator()
        container.add_text(f"**Name:** {guild.name}")
        container.add_text(f"**Owner:** {owner}")
        container.add_text(f"**Member:** {member_count}")
        

        log_channel_id = 1429163147687886889  
        log_channel = self.bot.get_channel(log_channel_id)

        if log_channel:
            view = DesignerView(container, timeout=None)
            await log_channel.send(view=view)
        
        print(f"[+] Bot ist neu auf: {guild.name}") 

def setup(bot):
    bot.add_cog(JoinAlert(bot))