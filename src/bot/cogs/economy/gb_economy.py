# Copyright (c) 2026 OPPRO.NET Network
import discord
from discord.ext import commands
from discord import SlashCommandGroup, Option
import ezcord
from mx_devtools import EconomyDatabase
from datetime import datetime, timedelta
import random

class GlobalEconomy(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db = EconomyDatabase()

    global_grp = SlashCommandGroup("global", "Global commands")
    economy = global_grp.create_subgroup("economy", "Global economy commands")
    shop = global_grp.create_subgroup("shop", "Global shop commands")

    @economy.command(name="balance", description="Check your global coin balance")
    async def global_balance(self, ctx: discord.ApplicationContext, user: Option(discord.Member, "Select a user", required=False)):
        target = user or ctx.author
        coins = self.db.get_global_balance(target.id)
        
        embed = discord.Embed(
            title="🌍 Globaler Kontostand",
            description=f"**{target.display_name}** hat **{coins}** 🪙 Coins.",
            color=discord.Color.gold()
        )
        embed.set_thumbnail(url=target.display_avatar.url)
        await ctx.respond(embed=embed)

    @economy.command(name="daily", description="Claim your daily global coins")
    async def global_daily(self, ctx: discord.ApplicationContext):
        user_info = self.db.get_user_economy_info(ctx.author.id)
        last_daily_raw = user_info.get('last_daily')
        
        if last_daily_raw:
            # Handle both SQLite timestamp formats
            try:
                last_daily = datetime.strptime(last_daily_raw, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    last_daily = datetime.fromisoformat(last_daily_raw)
                except ValueError:
                    last_daily = None
            
            if last_daily and datetime.utcnow() < last_daily + timedelta(days=1):
                next_daily = last_daily + timedelta(days=1)
                wait_time = next_daily - datetime.utcnow()
                hours, remainder = divmod(int(wait_time.total_seconds()), 3600)
                minutes, _ = divmod(remainder, 60)
                return await ctx.respond(f"❌ Du hast deine täglichen Coins bereits abgeholt. Warte noch **{max(0, hours)}h {max(0, minutes)}m**.", ephemeral=True)

        amount = random.randint(100, 250)
        if self.db.claim_daily(ctx.author.id, amount):
            embed = discord.Embed(
                title="🎁 Täglicher Bonus",
                description=f"Du hast **{amount}** 🪙 Coins erhalten!",
                color=discord.Color.green()
            )
            await ctx.respond(embed=embed)
        else:
            await ctx.respond("❌ Fehler beim Abholen des Bonus.", ephemeral=True)

    @shop.command(name="browse", description="Browse items in the global shop")
    async def shop_browse(self, ctx: discord.ApplicationContext):
        items = self.db.get_shop_items()
        if not items:
            return await ctx.respond("Der Shop ist aktuell leer.", ephemeral=True)
        
        embed = discord.Embed(
            title="🛒 Global Shop",
            description="Kaufe Upgrades für den GlobalChat!",
            color=discord.Color.blue()
        )
        
        for item in items:
            embed.add_field(
                name=f"{item['name']} (ID: {item['item_id']})",
                value=f"Preis: **{item['price']}** 🪙\n{item['description']}",
                inline=False
            )
        
        await ctx.respond(embed=embed)

    @shop.command(name="buy", description="Buy an item from the shop")
    async def shop_buy(self, ctx: discord.ApplicationContext, item_id: Option(int, "Enter the ID of the item")):
        success, message = self.db.buy_item(ctx.author.id, item_id)
        await ctx.respond(message, ephemeral=True)

    @shop.command(name="inventory", description="View your purchased items")
    async def shop_inventory(self, ctx: discord.ApplicationContext):
        items = self.db.get_user_inventory(ctx.author.id)
        if not items:
            return await ctx.respond("Dein Inventar ist leer. Kaufe etwas im `/global shop browse`!", ephemeral=True)
        
        embed = discord.Embed(
            title="🎒 Dein Inventar",
            description="Hier sind deine gekauften Upgrades.",
            color=discord.Color.purple()
        )
        
        for item in items:
            status = "✅ Ausgerüstet" if item['is_equipped'] else "❌ Nicht ausgerüstet"
            embed.add_field(
                name=f"{item['name']} (ID: {item['item_id']})",
                value=f"{status}\n{item['description']}",
                inline=False
            )
        
        await ctx.respond(embed=embed)

    @shop.command(name="equip", description="Equip an item from your inventory")
    async def shop_equip(self, ctx: discord.ApplicationContext, item_id: Option(int, "Enter the ID of the item")):
        inventory = self.db.get_user_inventory(ctx.author.id)
        owned_ids = [i['item_id'] for i in inventory]
        
        if item_id not in owned_ids:
            return await ctx.respond("❌ Du besitzt dieses Item nicht.", ephemeral=True)
        
        if self.db.equip_item(ctx.author.id, item_id):
            await ctx.respond("✅ Item erfolgreich ausgerüstet!", ephemeral=True)
        else:
            await ctx.respond("❌ Fehler beim Ausrüsten.", ephemeral=True)

def setup(bot):
    bot.add_cog(GlobalEconomy(bot))
