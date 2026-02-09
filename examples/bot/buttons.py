import discord
from discord import slash_command
import ezcord

class ExampleButtonsCog(ezcord.Cog):
    def __init__(self, bot: ezcord.Bot):
        self.bot = bot

    @slash_command(description="Button Example")
    async def buttons(self, ctx):
        await ctx.respond("Click here:", view=ExampleButtonView()) # Send the button

async def setup(bot):
    bot.add_cog(ExampleButtonsCog(bot))


class ExampleButtonView(discord.ui.View): # Create a view
    def __init__(self):
        super().__init__()

    @discord.ui.button(label="Click Me", style=discord.ButtonStyle.primary) # Create a button
    async def button_callback(self, button, interaction): # Define the button
        await interaction.response.send_message("You clicked the button!") # Send a message

    # Your can more Buttons adding in a View.

    @discord.ui.button(label="Delete", style=discord.ButtonStyle.danger) # Create a button
    async def delete_callback(self, button, interaction): # Define the button
        await interaction.message.delete() # Delete the message