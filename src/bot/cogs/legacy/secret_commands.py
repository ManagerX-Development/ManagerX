import discord
from discord.ext import commands
import ezcord
import random

class SecretCommands(ezcord.Cog, hidden=True):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="login")
    async def admin_login(self, ctx):
        await ctx.send("sie werden eingeloggt...")

    @commands.command(name="helau")
    async def helau(self, ctx):
        # Eine Liste mit verschiedenen Pegau-Vibes
        responses = [
            "**🎭 PEGAU HELAU!**",
            "**🎭 Ein dreifach donnerndes: PEGAU HELAU!**",
            "**🎭 Die Garde steht bereit! HELAU!**",
            "**🎭 Karneval in Pegau – das ist unsere Zeit!**",
            "**🎭 Helau, Helau, Helau! Auf eine geile Saison!**",
            "**🎭 Wer nicht hüpft, der ist kein Pegauer! HELAU!**"
            ]
            
        # Wählt einen zufälligen Spruch aus der Liste oben
        await ctx.send(random.choice(responses))

def setup(bot):
    bot.add_cog(SecretCommands(bot))