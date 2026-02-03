# How Works Embeds?

import discord
from discord import slash_command
import ezcord

class Embeds(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot

    @slash_command(name="embed", description="Embeds")
    async def embed(self, ctx):
        embed = discord.Embed(
            title="Hello World!", # Embed Title
            description="This is a embed", # Embed Description
            color=discord.Color.blue() # Embed Color
        )
        embed.set_author(
            name="Embeds", # Embed Author Name
            icon_url=self.bot.user.avatar.url # Embed Author Icon
        )
        embed.set_footer(
            text="Embeds", # Embed Footer Text
            icon_url=self.bot.user.avatar.url # Embed Footer Icon
        )
        embed.set_thumbnail(
            url=self.bot.user.avatar.url # Embed Thumbnail
        )
        embed.set_image(
            url=self.bot.user.avatar.url # Embed Image
        )
        await ctx.respond(embed=embed)

def setup(bot):
    bot.add_cog(Embeds(bot))  # Add the Cog to the Bot