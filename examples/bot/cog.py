import discord
import ezcord

class ExampleCog(ezcord.Cog): # Create a cog
    def __init__(self, bot): # Initialize the cog
        self.bot = bot # Set the bot

def setup(bot):
    bot.add_cog(ExampleCog(bot)) # Add the cog to the bot