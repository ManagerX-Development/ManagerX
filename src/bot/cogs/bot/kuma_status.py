# Copyright (c) 2026 ManagerX Development
# ───────────────────────────────────────────────
# >> Imports
# ───────────────────────────────────────────────
import discord
import ezcord
from discord.ext import tasks
from discord.ui import Container, DesignerView # Strictly following example imports
import json
import os
import aiohttp
import logging
from datetime import datetime
import asyncio

from src.bot.core.config import BotConfig
from src.bot.ui.emojis import emoji_yes, emoji_no, emoji_statistics, emoji_summary

logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────
# >> Constants & Hardcoded Config
# ───────────────────────────────────────────────
# SET YOUR CHANNEL ID HERE
STATUS_CHANNEL_ID = 0  # <--- HIER DIE CHANNEL ID EINTRAGEN

KUMA_BASE_URL = "https://status.oppro-network.de"
KUMA_SLUG = "status"
UPDATE_INTERVAL = 60 # Sekunden

STATE_FILE = "data/kuma_status_message.json"

# ───────────────────────────────────────────────
# >> Fetcher Logic
# ───────────────────────────────────────────────
class KumaFetcher:
    """Utility to fetch and parse Uptime Kuma status page data."""

    def __init__(self, base_url: str, slug: str):
        self.base_url = base_url.rstrip("/")
        self.slug = slug
        self.api_config_url = f"{self.base_url}/api/status-page/{self.slug}"
        self.api_heartbeat_url = f"{self.base_url}/api/status-page/heartbeat/{self.slug}"

    async def _get(self, url):
        async with aiohttp.ClientSession() as session:
            try:
                headers = {"User-Agent": "ManagerX/2.0.0 (Status Bot)"}
                async with session.get(url, timeout=10, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    print(f"[KUMA ERROR] HTTP {response.status} von {url}")
                    return None
            except Exception as e:
                print(f"[KUMA FETCH EXCEPTION] {e}")
                return None

    async def fetch_grouped_status(self):
        """Fetches both config and heartbeats and returns grouped data with PING."""
        config_data = await self._get(self.api_config_url)
        heartbeat_data = await self._get(self.api_heartbeat_url)

        if not config_data or not heartbeat_data:
            return None

        heartbeats = heartbeat_data.get("heartbeatList", {})
        uptime_list = heartbeat_data.get("uptimeList", {})

        grouped_data = []
        public_groups = config_data.get("publicGroupList", [])
        
        for group in public_groups:
            group_monitors = []
            for monitor in group.get("monitorList", []):
                m_id = str(monitor.get("id"))
                
                # Get latest heartbeat (status + ping)
                m_heartbeats = heartbeats.get(m_id, [])
                if m_heartbeats:
                    latest = m_heartbeats[-1]
                    status_code = latest.get("status", 0)
                    ping = latest.get("ping") # Ping in milliseconds
                else:
                    status_code = 0
                    ping = None

                status_map = {1: "UP", 0: "DOWN", 2: "PENDING", 3: "MAINTENANCE"}
                
                # Get uptime percentage
                uptime_val = uptime_list.get(f"{m_id}_24", 0)
                if not uptime_val:
                    uptime_val = next((v for k, v in uptime_list.items() if k.startswith(f"{m_id}_")), 0)

                group_monitors.append({
                    "name": monitor.get("name", "Unknown"),
                    "status": status_map.get(status_code, "DOWN"),
                    "uptime": uptime_val * 100 if uptime_val else None,
                    "ping": ping
                })
            
            if group_monitors:
                grouped_data.append({
                    "name": group.get("name", "Unkategorisiert"),
                    "monitors": group_monitors
                })
        
        return grouped_data

# ───────────────────────────────────────────────
# >> Cog Logic
# ───────────────────────────────────────────────
class KumaStatus(ezcord.Cog):
    """Hardcoded Uptime Kuma monitoring system with Response Times."""

    def __init__(self, bot):
        self.bot = bot
        self.message_id = self._load_state()
        print(f"[KUMA DEBUG] Cog geladen. Ziel-Channel: {STATUS_CHANNEL_ID}")
        self.update_status.start()

    def cog_unload(self):
        self.update_status.cancel()

    def _load_state(self):
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r") as f:
                    return json.load(f).get("message_id")
            except Exception: return None
        return None

    def _save_state(self, msg_id):
        self.message_id = msg_id
        os.makedirs("data", exist_ok=True)
        with open(STATE_FILE, "w") as f:
            json.dump({"message_id": msg_id}, f, indent=4)

    async def _create_status_view(self, groups):
        """Generates the status message including response times."""
        container = Container(color=discord.Color.from_rgb(*BotConfig.ui.colors.primary))
        
        container.add_text(f"## 🌐 Infrastruktur Status")
        container.add_text("Echtzeit-Überwachung der OPPRO.NET Server und Dienste.")
        container.add_separator()

        overall_up = True
        
        for group in groups:
            group_text = ""
            for m in group["monitors"]:
                indicator = "🟢" if m["status"] == "UP" else "🔴"
                if m["status"] != "UP": overall_up = False
                
                # Format: Name (Uptime | Ping)
                details = []
                if m.get("uptime"): details.append(f"{m['uptime']:.2f}%")
                if m.get("ping") is not None: details.append(f"{m['ping']}ms")
                
                detail_str = f" ({' | '.join(details)})" if details else ""
                group_text += f"{indicator} **{m['name']}** • `{m['status']}`{detail_str}\n"
            
            container.add_text(f"### 📁 {group['name']}")
            container.add_text(group_text or "*Keine Monitore*")
            container.add_separator()

        summary = "Alle Systeme laufen einwandfrei." if overall_up else "Einige Dienste sind derzeit beeinträchtigt."
        container.add_text(f"### {emoji_statistics} Zusammenfassung")
        container.add_text(f"{'✅' if overall_up else '⚠️'} {summary}")
        
        try:
            container.set_footer(text=f"{BotConfig.ui.footer_text} • Update: {UPDATE_INTERVAL}s")
        except AttributeError:
             container.add_separator()
             container.add_text(f"*{BotConfig.ui.footer_text} • Update: {UPDATE_INTERVAL}s*")
        
        return DesignerView(container, timeout=0)

    @tasks.loop(seconds=UPDATE_INTERVAL)
    async def update_status(self):
        if STATUS_CHANNEL_ID == 0: return

        fetcher = KumaFetcher(KUMA_BASE_URL, KUMA_SLUG)
        groups = await fetcher.fetch_grouped_status()
        
        if not groups:
            print(f"[KUMA] Konnte keine gruppierten Daten abrufen.")
            return

        view = await self._create_status_view(groups)

        try:
            channel = self.bot.get_channel(STATUS_CHANNEL_ID)
            if not channel: channel = await self.bot.fetch_channel(STATUS_CHANNEL_ID)
            
            if self.message_id:
                try:
                    msg = await channel.fetch_message(self.message_id)
                    await msg.edit(view=view)
                except discord.NotFound:
                    msg = await channel.send(view=view)
                    self._save_state(msg.id)
            else:
                msg = await channel.send(view=view)
                self._save_state(msg.id)
        except Exception as e: print(f"Error: {e}")

    @update_status.before_loop
    async def before_update_status(self):
        await self.bot.wait_until_ready()

def setup(bot):
    bot.add_cog(KumaStatus(bot))
