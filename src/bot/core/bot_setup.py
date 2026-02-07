"""
ManagerX - Bot Setup
====================

Initialisiert und konfiguriert die Discord Bot-Instanz
Pfad: src/bot/core/bot_setup.py
"""

import discord
import ezcord

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
        bot = ezcord.Bot(
            intents=intents,
            language="de"
        )
        
        # Ezcord Help Command aktivieren
        embed = discord.Embed(
            title="Hello, I'm ManagerX!", # Placeholder emoji, will fall back to text if not found
            description=(
                "**The ultimate all-in-one Discord solution.**\n\n"
                "> ManagerX simplifies server management and brings your community "
                "together with engaging games and reliable tools.\n\n"
                "✨ **Getting Started**\n"
                "Use the menu below to explore all commands!"
            ),
            color=discord.Color.from_rgb(46, 204, 113), # Fresh emerald green
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
                "🌐 [**Website**](https://managerx-bot.de) • "
                "🚑 [**Support**](https://discord.gg/SrcE6zJZ) • "
                "💻 [**GitHub**](https://github.com/ManagerX-Development/ManagerX)"
            ),
            inline=False
        )
        
        # Check if we can set a thumbnail or image (safe fallback)
        embed.set_footer(text="ManagerX • Empowering your Community", icon_url=None)

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