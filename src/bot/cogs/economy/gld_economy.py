# Copyright (c) 2026 OPPRO.NET Network
import discord
from discord.ext import commands
from discord import slash_command, Option
import ezcord
from mx_devtools import EconomyDatabase

class GuildEconomy(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db = EconomyDatabase()

    @slash_command(name="balance", description="Check your server coin balance")
    async def balance(self, ctx: discord.ApplicationContext, user: Option(discord.Member, "Select a user", required=False)):
        target = user or ctx.author
        if target.bot:
            return await ctx.respond("Bots haben kein Konto.", ephemeral=True)
            
        coins = self.db.get_guild_balance(ctx.guild.id, target.id)
        
        embed = discord.Embed(
            title=f"💰 Kontostand - {ctx.guild.name}",
            description=f"**{target.display_name}** hat **{coins}** 🪙 Coins auf diesem Server.",
            color=discord.Color.blue()
        )
        embed.set_thumbnail(url=target.display_avatar.url)
        await ctx.respond(embed=embed)

    @slash_command(name="pay", description="Transfer coins to another user on this server")
    async def pay(self, ctx: discord.ApplicationContext, 
                  user: Option(discord.Member, "Who do you want to pay?"), 
                  amount: Option(int, "How many coins?", min_value=1)):
        
        if user.id == ctx.author.id:
            return await ctx.respond("Du kannst dir nicht selbst Geld senden.", ephemeral=True)
        if user.bot:
            return await ctx.respond("Du kannst Bots kein Geld senden.", ephemeral=True)

        author_balance = self.db.get_guild_balance(ctx.guild.id, ctx.author.id)
        if author_balance < amount:
            return await ctx.respond(f"Du hast nicht genug Coins (Guthaben: {author_balance}).", ephemeral=True)

        # Transfer
        self.db.add_guild_coins(ctx.guild.id, ctx.author.id, -amount)
        self.db.add_guild_coins(ctx.guild.id, user.id, amount)

        embed = discord.Embed(
            title="💸 Überweisung erfolgreich",
            description=f"Du hast **{amount}** 🪙 Coins an **{user.display_name}** gesendet.",
            color=discord.Color.green()
        )
        await ctx.respond(embed=embed)

def setup(bot):
    bot.add_cog(GuildEconomy(bot))
