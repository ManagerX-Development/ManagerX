# Copyright (c) 2026 ManagerX Development
# ───────────────────────────────────────────────
# >> Imports
# ───────────────────────────────────────────────
import discord
import ezcord
from discord import slash_command, Option
from discord.ui import Container, DesignerView
from mxmariadb import ManagementDatabase
import logging
import io

db = ManagementDatabase()
logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────
# >> Constants & Hardcoded Config
# ───────────────────────────────────────────────
DEV_MASTER_CHANNEL_ID = 1474438159465971872

class NewsSync(ezcord.Cog):
    """Synchronizes messages across custom server networks."""

    def __init__(self, bot):
        self.bot = bot

    @ezcord.Cog.listener()
    async def on_ready(self):
        await db.ensure_connection()

    @ezcord.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        await db.ensure_connection()
        all_channels = await db.get_sync_channels()
        
        # 1. Check for Developer News (Always Global)
        if message.channel.id == DEV_MASTER_CHANNEL_ID:
            targets = [c for c in all_channels if c['sync_group'] == 'dev_news' and not c['is_master']]
            if targets:
                # Count unique guilds subscribed to dev_news
                guild_count = len(set(c['guild_id'] for c in targets))
                embed = self._build_dev_embed(message, guild_count)
                await self._broadcast(targets, embed, message)
            return

        # 2. Check if this is a Master for ANY network
        # The sync_group for regular networks is the MASTER'S GUILD ID
        masters = [c for c in all_channels if c['channel_id'] == message.channel.id and c['is_master'] and c['sync_group'] != 'dev_news']
        
        for master in masters:
            network_id = master['sync_group']
            # Find all subscribers to THIS SPECIFIC network_id
            targets = [c for c in all_channels if c['sync_group'] == network_id and not c['is_master']]
            
            if targets:
                embed = self._build_network_embed(message)
                await self._broadcast(targets, embed, message)

    def _build_dev_embed(self, message, guild_count: int = 0):
        embed = discord.Embed(
            title="🛠️ **ManagerX Engineering Updates**",
            description=message.content or "*Bild-Nachricht*",
            color=discord.Color.gold(),
            timestamp=message.created_at
        )
        footer_text = f"Official Developer Feed • {message.guild.name}"
        if guild_count > 0:
            footer_text += f" • Guilds: {guild_count}"
            
        embed.set_footer(text=footer_text)
        if message.attachments: embed.set_image(url=message.attachments[0].url)
        return embed

    def _build_network_embed(self, message):
        embed = discord.Embed(
            description=message.content or "*Ankündigung*",
            color=discord.Color.blue(),
            timestamp=message.created_at
        )
        embed.set_author(name=f"News von {message.guild.name}", icon_url=message.guild.icon.url if message.guild.icon else None)
        if message.attachments: embed.set_image(url=message.attachments[0].url)
        return embed

    async def _broadcast(self, targets, embed, original_message):
        for target in targets:
            try:
                channel = self.bot.get_channel(target['channel_id'])
                if not channel: channel = await self.bot.fetch_channel(target['channel_id'])
                await channel.send(embed=embed)
            except: pass

    # --- Commands ---
    news_sync = discord.SlashCommandGroup("newssync", "Verwalte dein eigenes Server-Netzwerk")

    @news_sync.command(name="set-master", description="Macht diesen Kanal zum Haupt-Kanal DEINES Netzwerks")
    async def set_master(self, ctx: discord.ApplicationContext):
        await db.ensure_connection()
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Berechtigung **Server verwalten** erforderlich.", ephemeral=True)

        # Network ID is the Guild ID of the master server
        network_id = str(ctx.guild.id)
        await db.add_sync_channel(ctx.guild.id, ctx.channel.id, is_master=True, sync_group=network_id)
        
        await ctx.respond(f"✅ Dieser Kanal ist nun der Master für dein Netzwerk!\n**Netzwerk-ID:** `{network_id}`\n\nAndere Server können dein Netzwerk abonnieren mit:\n`/newssync subscribe {network_id}`", ephemeral=True)

    @news_sync.command(name="subscribe", description="Abonniere ein spezifisches Server-Netzwerk per ID")
    async def subscribe(self, ctx: discord.ApplicationContext, network_id: Option(str, "Die ID des Netzwerks (Server-ID des Masters)", required=True)):
        await db.ensure_connection()
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Berechtigung **Server verwalten** erforderlich.", ephemeral=True)

        # Check if it's the dev news ID manually redirected
        if network_id == "dev": network_id = "dev_news"

        await db.add_sync_channel(ctx.guild.id, ctx.channel.id, is_master=False, sync_group=network_id)
        await ctx.respond(f"✅ Erfolg! Dieser Kanal erhält nun News vom Netzwerk `{network_id}`.", ephemeral=True)

    # --- Dev News ---
    dev_news = discord.SlashCommandGroup("devnews", "Offizielle ManagerX News")

    @dev_news.command(name="subscribe", description="Abonniere die offiziellen Updates der Entwickler")
    async def subscribe_dev(self, ctx: discord.ApplicationContext):
        await db.ensure_connection()
        if not ctx.author.guild_permissions.manage_guild:
            return await ctx.respond("❌ Berechtigung erforderlich.", ephemeral=True)

        await db.add_sync_channel(ctx.guild.id, ctx.channel.id, is_master=False, sync_group="dev_news")
        await ctx.respond(f"🛠️ Du erhältst nun offizielle Bot-Updates!", ephemeral=True)

def setup(bot):
    bot.add_cog(NewsSync(bot))
