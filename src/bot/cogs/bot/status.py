import discord
from discord.ext import commands, tasks
import aiohttp
import logging

class StatusCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Deine Uptime Kuma Push URL
        self.push_url = "https://status.oppro-network.de/api/push/f9jAKPSCUqWUBTK91oFKOsRE60MwwOo9"
        self.status_heartbeat.start()

    def cog_unload(self):
        self.status_heartbeat.cancel()

    @tasks.loop(seconds=30)
    async def status_heartbeat(self):
        """Sendet alle 60 Sekunden den Status an Uptime Kuma."""
        # Warte, bis der Bot bereit ist, um Fehlberechnungen beim Ping zu vermeiden
        await self.bot.wait_until_ready()

        # Berechne den aktuellen Discord-Ping in Millisekunden
        current_ping = round(self.bot.latency * 1000)
        
        # Parameter für die API
        params = {
            "status": "up",
            "msg": "ManagerXBot: System aktiv",
            "ping": current_ping
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.push_url, params=params, timeout=10) as response:
                    if response.status == 200:
                        logging.info(f"[Status] Push erfolgreich (Ping: {current_ping}ms)")
                    else:
                        logging.error(f"[Status] Fehler beim Push! HTTP {response.status}")
        except Exception as e:
            logging.error(f"[Status] Verbindung zur Statusseite fehlgeschlagen: {e}")

    @status_heartbeat.before_loop
    async def before_status_heartbeat(self):
        await self.bot.wait_until_ready()

def setup(bot):
    bot.add_cog(StatusCog(bot))