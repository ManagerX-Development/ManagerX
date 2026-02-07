import discord
import ezcord
from discord import slash_command

class SlashCommand(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @slash_command(name="ping", description="Pong!") # Create a slash command
    async def ping(self, ctx): # Define the slash command
        await ctx.respond("Pong!") # Send a message

def setup(bot):
    bot.add_cog(SlashCommand(bot)) 