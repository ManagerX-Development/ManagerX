# Copyright (c) 2025 OPPRO.NET Network
import discord
from discord.ext import commands
import ezcord
from datetime import datetime
import platform
import sys
import time
from discord.ui import Container


class AboutCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Fallback for uptime if bot.uptime is not set
        if not hasattr(self.bot, 'uptime'):
            self.bot.uptime = datetime.now()

    @discord.slash_command(name="about", description="Zeigt Informationen über den Bot an")
    async def about(self, ctx: discord.ApplicationContext):
        """Shows advanced information about the bot."""
        await ctx.defer()
        
        # Determine versions
        python_version = platform.python_version()
        discord_version = discord.__version__
        ezcord_version = ezcord.__version__
        
        # Calculate uptime
        uptime = discord.utils.format_dt(self.bot.uptime, style="R")
        
        # Calculate ping
        ping = f"**{round(self.bot.latency * 1000)}ms**"
        
        # Counts
        server_count = len(self.bot.guilds)
        member_count = sum(g.member_count for g in self.bot.guilds)
        
        # Create Container
        container = Container()
        
        # Header
        container.add_text(f"# ℹ️ Über {self.bot.user.name}")
        container.add_text(
            "Ein fortschrittlicher Management-Bot entwickelt für professionelle Communities.\n"
            "ManagerX bietet umfangreiche Tools für Moderation, Statistiken und Server-Verwaltung."
        )
        container.add_separator()
        
        # Development
        container.add_text("## 👨💻 Entwicklung")
        container.add_text(
            "Entwickelt von **ManagerX Development**\n"
            "❯ [🌐 Website](https://managerx-bot.de)\n"
            "❯ [💬 Support Server](https://discord.gg/uDDWzsZNzD)"
        )
        container.add_separator()
        
        # Stats
        container.add_text("## 📊 Statistiken")
        container.add_text(
            f"❯ **Server:** `{server_count}`\n"
            f"❯ **User:** `{member_count:,}`\n"
            f"❯ **Ping:** {ping}\n"
            f"❯ **Uptime:** {uptime}"
        )
        container.add_separator()
        
        # Technical
        container.add_text("## 🛠️ Technik & Versionen")
        container.add_text(
            f"❯ **Python:** `v{python_version}`\n"
            f"❯ **PyCord:** `v{discord_version}`\n"
            f"❯ **EzCord:** `v{ezcord_version}`"
        )
        container.add_separator()
        
        # Footer
        container.add_text(f"{datetime.now().year} ManagerX Development • ManagerX v2.0.0")
        
        # Send View
        view = discord.ui.DesignerView(container, timeout=0)
        await ctx.respond(view=view)

def setup(bot):
    bot.add_cog(AboutCog(bot))