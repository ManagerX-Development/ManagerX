# How Works Containers?

# First import the Modul
import discord
from discord.ui import Container # Import the Container Class
import ezcord

class ContainerExample(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.slash_command(name="container", description="Zeigt ein Container an")
    async def container(self, ctx: discord.ApplicationContext):
        container = Container(color=discord.Color.blue()) # Define the Container with a color
        container.add_text("## Hello World") # Add a Markdown Text to the Container
        container.add_separator() # Add a Separator to the Container
        container.add_text("Hello World") # Add a Text to the Container
        view = discord.ui.DesignerView(container, timeout=0) # Define the View
        await ctx.respond(view=view) # Send the View

def setup(bot):
    bot.add_cog(ContainerExample(bot))  # Add the Cog to the Bot
