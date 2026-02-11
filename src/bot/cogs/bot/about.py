from datetime import datetime
import platform
import discord
from discord.ext import commands
import psutil
import ezcord
from mx_handler import TranslationHandler

class About(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Fallback for uptime if bot.start_time is not set
        if not hasattr(self.bot, 'start_time'):
            self.bot.start_time = datetime.now()

    @discord.slash_command(name="about", description="Zeigt Informationen über den Bot an")
    async def about(self, ctx: discord.ApplicationContext):
        """Shows advanced information about the bot."""
        await ctx.defer()
        
        # Determine versions
        python_version = platform.python_version()
        discord_version = discord.__version__
        ezcord_version = ezcord.__version__
        
        # Calculate uptime
        uptime = discord.utils.format_dt(self.bot.start_time, style="R")
        
        # Calculate ping
        ping = f"**{round(self.bot.latency * 1000)}ms**"
        
        # Counts
        server_count = len(self.bot.guilds)
        member_count = sum(g.member_count for g in self.bot.guilds)
        
        # Create Container
        container = discord.ui.Container(color=discord.Color.red())
        
        # Header
        title = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.title")
        description = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.description")
        
        container.add_text(title)
        container.add_text(description)
        container.add_separator()
        
        # Development
        dev_header = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.dev_header")
        dev_info = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.dev_info")
        
        container.add_text(dev_header)
        container.add_text(dev_info)
        container.add_separator()
        
        # Stats
        stats_header = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.stats_header")
        stats_info = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.stats_info",
            server_count=server_count,
            member_count=f"{member_count:,}",
            ping=ping,
            uptime=uptime
        )
        
        container.add_text(stats_header)
        container.add_text(stats_info)
        container.add_separator()
        
        # Technical
        tech_header = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.tech_header")
        tech_info = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.tech_info",
            python_version=python_version,
            discord_version=discord_version,
            ezcord_version=ezcord_version
        )
        
        container.add_text(tech_header)
        container.add_text(tech_info)
        container.add_separator()
        
        # System
        system_header = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.system_header")
        
        # Gather System Info
        os_info = f"{platform.system()} {platform.release()}"
        
        memory = psutil.virtual_memory()
        ram_info = f"{memory.used / (1024 ** 3):.2f} GB / {memory.total / (1024 ** 3):.2f} GB"
        
        # CPU can be 0 on first call without interval, but blocking is bad.
        # We'll stick to non-blocking.
        cpu_usage = f"{psutil.cpu_percent()}%"
        
        try:
            if platform.system() == "Windows":
                 storage_info = "N/A"
            else:
                disk = psutil.disk_usage("/")
                storage_info = f"{disk.used / (1024 ** 3):.2f} GB / {disk.total / (1024 ** 3):.2f} GB"
        except Exception:
             storage_info = "N/A"
        
        system_info = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.system_info",
            os=os_info,
            ram=ram_info,
            cpu=cpu_usage,
            storage=storage_info
        )
        
        container.add_text(system_header)
        container.add_text(system_info)
        container.add_separator()
        
        # Footer
        footer = await TranslationHandler.get_for_user(self.bot, ctx.author.id, "cog_about.messages.footer",
            year=datetime.now().year,
            version="2.0.0"
        )
        container.add_text(footer)
        
        # Send View
        view = discord.ui.DesignerView(container, timeout=0)
        await ctx.respond(view=view)

def setup(bot):
    bot.add_cog(About(bot))