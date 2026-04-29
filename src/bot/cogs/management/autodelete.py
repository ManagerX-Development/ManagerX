from mxmariadb import AutoDeleteDB
import discord
from discord.ext import tasks
from discord.commands import SlashCommandGroup, Option
import ezcord
import asyncio
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AutoDelete(ezcord.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.processing_channels = set()
        self.db = AutoDeleteDB()
        # WICHTIG: KEIN create_task hier im __init__!
        self.delete_task.start()

    autodelete = SlashCommandGroup("autodelete", "Automatische Nachrichtenlöschung")

    @autodelete.command(name="setup", description="Richtet AutoDelete für einen Kanal ein.")
    async def setup(self, ctx,
                    channel: Option(discord.TextChannel, "Kanal", required=True),
                    duration: Option(int, "Zeit in Sekunden", required=True)):
        await ctx.defer(ephemeral=True)
        await self.db.add_autodelete(channel.id, duration)
        await ctx.followup.send(f"✅ AutoDelete für {channel.mention} aktiviert!")

    @autodelete.command(name="list", description="Zeigt alle aktiven AutoDelete-Kanäle.")
    async def list(self, ctx):
        await ctx.defer(ephemeral=True)
        channels = await self.db.get_all()
        
        if not channels:
            return await ctx.followup.send("❌ Keine AutoDelete-Kanäle gefunden.")

        embed = discord.Embed(title="🗑️ Aktive AutoDelete-Kanäle", color=discord.Color.blue())
        for chan_id, duration, exp, exb in channels:
            channel = self.bot.get_channel(chan_id)
            name = f"#{channel.name}" if channel else f"ID: {chan_id}"
            embed.add_field(name=name, value=f"⏱️ {duration}s", inline=True)

        await ctx.followup.send(embed=embed)

    @tasks.loop(seconds=30)
    async def delete_task(self):
        # Der eigentliche Loop-Inhalt
        try:
            channels = await self.db.get_all()
            if not channels: return

            for chan_id, duration, exp, exb in channels:
                if chan_id not in self.processing_channels:
                    await self._process_channel_deletion(chan_id)
        except Exception as e:
            logger.error(f"Fehler im delete_task: {e}")

    @delete_task.before_loop
    async def before_delete_task(self):
        """Hier wird die DB sicher initialisiert, wenn der Loop bereits läuft."""
        await self.bot.wait_until_ready()
        # JETZT ist der Loop bereit, jetzt können wir connecten
        print("[DB] Initialisiere AutoDelete Tabellen...")
        await self.db.init_db()
        print("[DB] AutoDelete Tabellen bereit.")

    async def _process_channel_deletion(self, channel_id):
        self.processing_channels.add(channel_id)
        try:
            config = await self.db.get_autodelete_full(channel_id)
            if not config: return
            
            duration, exp, exb = config
            channel = self.bot.get_channel(channel_id)
            if not channel: return

            cutoff = discord.utils.utcnow() - timedelta(seconds=duration)
            
            # Sammle Nachrichten zum Löschen
            to_delete = []
            async for msg in channel.history(limit=100, oldest_first=True):
                if msg.created_at < cutoff:
                    if not (exp and msg.pinned) and not (exb and msg.author.bot):
                        to_delete.append(msg)
                else:
                    break # Nachrichten werden neuer, wir können aufhören
            
            if to_delete:
                # Bulk Delete nur für Nachrichten unter 14 Tage
                two_weeks = discord.utils.utcnow() - timedelta(days=14)
                to_bulk = [m for m in to_delete if m.created_at > two_weeks]
                
                if to_bulk:
                    await channel.delete_messages(to_bulk)
                    await self.db.update_stats(channel_id, len(to_bulk), 0)
        except Exception as e:
            logger.error(f"Fehler beim Löschen in {channel_id}: {e}")
        finally:
            self.processing_channels.discard(channel_id)

def setup(bot):
    bot.add_cog(AutoDelete(bot))