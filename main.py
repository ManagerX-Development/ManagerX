"""
ManagerX Discord Bot - Main Entry Point
========================================

Copyright (c) 2025 OPPRO.NET Network
Version: 2.0.0
"""

# =============================================================================
# IMPORTS
# =============================================================================
import discord
import sys
import asyncio
from pathlib import Path
from datetime import datetime
from colorama import Fore, Style, init as colorama_init
from dotenv import load_dotenv
import ezcord
from ezcord import CogLog
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from uvicorn import Server, Config

# Logger (muss existieren!)
from logger import logger

# =============================================================================
# SETUP
# =============================================================================
# =============================================================================
# SETUP & CONFIG
# =============================================================================
BASEDIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASEDIR / 'config' / '.env')

# Lokale Module aus src/bot/core
from src.bot.core.config import ConfigLoader, BotConfig
from src.bot.core.bot_setup import BotSetup
from src.bot.core.cog_manager import CogManager
from src.bot.core.database import DatabaseManager
from src.bot.core.dashboard import DashboardTask
from src.bot.core.utils import print_logo

# Early config load (must happen before module-level usage)
config_loader = ConfigLoader(BASEDIR)
config = config_loader.load()

# API Routes & Translation
from src.api.dashboard.routes import set_bot_instance, dashboard_main_router, router_public
from mx_handler import TranslationHandler

colorama_init(autoreset=True)

print(f"[{Fore.BLUE}DEBUG{Style.RESET_ALL}] Translation Config: {BotConfig.translation}")
print(f"[{Fore.BLUE}DEBUG{Style.RESET_ALL}] Translation Path: {BotConfig.translation.path} (Type: {type(BotConfig.translation.path)})")

TranslationHandler.settings(
    path=str(BotConfig.translation.path) if BotConfig.translation.path else "translation/messages",
    default_lang=BotConfig.translation.default_lang,
    fallback_langs=tuple(BotConfig.translation.fallback_langs),
    logging=False,
    colored=False,
    log_level="DEBUG"
)

# Sys-Path
if str(BASEDIR) not in sys.path:
    sys.path.append(str(BASEDIR))

# =============================================================================
# FASTAPI SETUP
# =============================================================================
app = FastAPI(
    title="ManagerX Dashboard API",
    description="Live Bot Status & Statistiken API",
    version=BotConfig.VERSION
)

# CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=BotConfig.api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dashboard-Routes einbinden
app.include_router(dashboard_main_router)
app.include_router(router_public)

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    """Disallow all crawlers for the API."""
    return "User-agent: *\nDisallow: /"

async def start_webserver():
    """Startet den FastAPI Webserver"""
    server_config = Config(
        app=app, 
        host=BotConfig.api.host, 
        port=BotConfig.api.port, 
        log_level=BotConfig.api.log_level
    )
    server = Server(server_config)
    await server.serve()
    logger.success("API", f"FastAPI-Server läuft auf http://{BotConfig.api.host}:{BotConfig.api.port}")

# =============================================================================
# MAIN EXECUTION
# =============================================================================
if __name__ == '__main__':
    # Logo ausgeben
    print_logo()
    
    logger.info("BOT", "Konfiguration bereits geladen (Early Load)")
    
    # Bot erstellen
    logger.info("BOT", "Initialisiere Bot...")
    bot_setup = BotSetup(config)
    bot = bot_setup.create_bot()
    
    # Speichere Bot Start-Zeit für Uptime-Berechnung
    bot.start_time = discord.utils.utcnow()
    
    # Übergebe Bot-Instanz an die API-Routes
    set_bot_instance(bot)
    logger.info("API", "Bot-Instanz an Dashboard-API übergeben")
    
    # Datenbank initialisieren
    db_manager = DatabaseManager()
    if not db_manager.initialize(bot):
        logger.warn("DATABASE", "Bot läuft ohne Datenbank weiter...")
    else:
        logger.success("DATABASE", "Datenbank erfolgreich initialisiert")
    
    # Dashboard-Task registrieren
    dashboard = DashboardTask(bot, BASEDIR)
    dashboard.register()
    
    @bot.event
    async def on_ready():
        logger.success("BOT", f"Logged in as {bot.user.name}")
        
        # --- NEU: Status API & Webserver starten ---
        bot.loop.create_task(start_webserver())
            
        # Dashboard starten
        dashboard.start()
            
        # Bot-Status
        if BotConfig.features.get('bot_status', True):
            await bot.change_presence(
                activity=discord.Activity(
                    type=discord.ActivityType.watching,
                    name=f"ManagerX v{BotConfig.VERSION}"
                )
            )
            
        # --- LIMIT CHECK START ---
        all_cmds = bot.pending_application_commands
        # Wir zählen nur die echten Top-Level Slash Commands (Slots)
        root_slots = [c for c in all_cmds if isinstance(c, discord.SlashCommand)]
            
        logger.info("LIMITS", f"EzCord zählt (alle Funktionen): {len(bot.commands)}")
        logger.info("LIMITS", f"Discord-API Slots belegt: {len(root_slots)} / 100")
        # --- LIMIT CHECK ENDE ---

    @bot.before_invoke
    async def maintenance_check(ctx: discord.ApplicationContext):
        """Global check for maintenance mode."""
        if BotConfig.bot.maintenance_mode:
            # Owners are exempt
            if ctx.author.id in BotConfig.security.bot_owners:
                return
            
            embed = discord.Embed(
                title="🔧 Wartungsmodus",
                description="Der Bot befindet sich aktuell im Wartungsmodus.\nBitte versuche es später erneut.",
                color=discord.Color.from_rgb(*BotConfig.ui.colors.warning)
            )
            embed.add_field(name="Support", value=BotConfig.links.support)
            await ctx.respond(embed=embed, ephemeral=True)
            raise commands.CheckFailure("Maintenance Mode Active")

    @bot.event
    async def on_application_command_completion(ctx: discord.ApplicationContext):
        """Track command usage across all guilds."""
        if ctx.guild and hasattr(bot, 'stats_db'):
            try:
                await bot.stats_db.log_command(ctx.guild.id, ctx.command.qualified_name)
            except Exception as e:
                logger.error("STATS", f"Fehler beim Loggen des Commands: {e}")

    # Minimaler KeepAlive Cog
    class KeepAlive(discord.ext.commands.Cog):
        def __init__(self, bot):
            self.bot = bot
        
        @discord.ext.commands.Cog.listener()
        async def on_ready(self):
            logger.info("KEEPALIVE", "KeepAlive Cog aktiv - Bot bleibt online")
    
    bot.add_cog(KeepAlive(bot))
    logger.success("BOT", "KeepAlive Cog geladen")
    
    # Cogs laden
    logger.info("BOT", "Lade Cogs...")
    cog_manager = CogManager(BotConfig.features.get('cogs', {}))
    ignored = cog_manager.get_ignored_cogs()
    
    bot.load_cogs(
        "src/bot/cogs",
        subdirectories=True,
        ignored_cogs=ignored,
    )
    logger.success("BOT", "Cogs geladen")
    
    # Token prüfen
    if not BotConfig.TOKEN:
        logger.critical("DEBUG", "Kein TOKEN in .env gefunden!")
        sys.exit(1)
    
    # Bot starten
    logger.info("BOT", "Starte Bot...")
    try:
        bot.run(BotConfig.TOKEN)
    except discord.LoginFailure:
        logger.critical("BOT", "Ungültiger Token!")
        sys.exit(1)
    except Exception as e:
        logger.critical("BOT", f"Bot-Start fehlgeschlagen: {e}")
        sys.exit(1)