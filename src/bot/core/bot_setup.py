"""
ManagerX - Bot Setup
====================

Initialisiert und konfiguriert die Discord Bot-Instanz
Pfad: src/bot/core/bot_setup.py
"""

import discord
import ezcord
from .config import BotConfig

class BotSetup:
    """Verwaltet die Bot-Initialisierung"""
    
    def __init__(self, config: dict):
        self.config = config
    
    def create_bot(self) -> ezcord.Bot:
        """
        Erstellt und konfiguriert die Bot-Instanz.
        
        Returns:
            ezcord.Bot: Konfigurierte Bot-Instanz
        """
        # Intents konfigurieren
        intents = discord.Intents.default()
        intents.members = True
        intents.message_content = True
        intents.presences = True
        
        # Bot erstellen
        bot = ezcord.PrefixBot(
            intents=intents,
            language=BotConfig.bot.language,
            command_prefix=BotConfig.bot.prefix,
            help_command=None
        )
        
        # Ezcord Help Command aktivieren
        embed = discord.Embed(
            title=f"Hello, I'm {BotConfig.bot.name}!", 
            description=(
                f"**The ultimate all-in-one Discord solution.**\n\n"
                f"> {BotConfig.bot.name} simplifies server management and brings your community "
                "together with engaging games and reliable tools.\n\n"
                "✨ **Getting Started**\n"
                "Use the menu below to explore all commands!"
            ),
            color=discord.Color.from_rgb(*BotConfig.ui.colors.primary),
            timestamp=discord.utils.utcnow()
        )

        embed.add_field(
            name="💎 **Core Modules**",
            value=(
                "🛡️ **Moderation** • Advanced security tools\n"
                "🏆 **Leveling** • Activity & rewards system\n"
                "🎮 **Games** • Connect4, TicTacToe & more\n"
                "📊 **Logging** • Real-time server insights"
            ),
            inline=False
        )

        embed.add_field(
            name="🔗 **Important Links**",
            value=(
                f"🌐 [**Website**]({BotConfig.links.website}) • "
                f"🚑 [**Support**]({BotConfig.links.support}) • "
                f"💻 [**GitHub**]({BotConfig.links.github})"
            ),
            inline=False
        )
        
        # Check if we can set a thumbnail or image (safe fallback)
        embed.set_footer(text=BotConfig.ui.footer_text, icon_url=None)

        bot.add_help_command(
            embed=embed,
            show_categories=False,
            show_description=True
        )
        
        # Bot-Konfiguration anhängen
        bot.config = self._build_bot_config()
        
        return bot
    
    def _build_bot_config(self) -> dict:
        """
        Erstellt die Bot-Config aus der geladenen Konfiguration.
        
        Returns:
            dict: Bot-Konfiguration für Runtime
        """
        ui = self.config.get('ui', {})
        behavior = self.config.get('bot_behavior', {})
        security = self.config.get('security', {})
        performance = self.config.get('performance', {})
        
        return {
            # UI Settings
            'embed_color': ui.get('embed_color', '#00ff00'),
            'footer_text': ui.get('footer_text', 'ManagerX Bot'),
            'theme': ui.get('theme', 'dark'),
            'show_timestamps': ui.get('show_timestamps', True),
            
            # Behavior
            'maintenance_mode': behavior.get('maintenance_mode', False),
            'global_cooldown': behavior.get('global_cooldown_seconds', 5),
            'max_messages_per_minute': behavior.get('max_messages_per_minute', 10),
            
            # Security
            'required_permissions': security.get('required_permissions', []),
            'blacklist_servers': security.get('blacklist_servers', []),
            'whitelist_users': security.get('whitelist_users', []),
            'enable_command_logging': security.get('enable_command_logging', True),
            
            # Performance
            'max_concurrent_tasks': performance.get('max_concurrent_tasks', 10),
            'task_timeout': performance.get('task_timeout_seconds', 30),
            'memory_limit': performance.get('memory_limit_mb', 512),
            'enable_gc_optimization': performance.get('enable_gc_optimization', True)
        }