"""
ManagerX Core Module
====================

Zentrale Module für Bot-Initialisierung und -Verwaltung
"""

from .config import ConfigLoader, BotConfig
from .bot_setup import BotSetup
from .cog_manager import CogManager
from .database import DatabaseManager
from .dashboard import DashboardTask
from .utils import print_logo, format_uptime, truncate_text
from .constants import *

__all__ = [
    'ConfigLoader',
    'BotConfig',
    'BotSetup',
    'CogManager',
    'DatabaseManager',
    'DashboardTask',
    'print_logo',
    'format_uptime',
    'truncate_text',
    'SUCCESS_COLOR',
    'ERROR_COLOR',
    'WARN_COLOR',
    'INFO_COLOR',
    'emoji_yes',
    'emoji_no',
    'emoji_warn',
    'emoji_info',
    'emoji_forbidden',
    'emoji_member',
    'emoji_staff',
    'emoji_summary',
    'emoji_slowmode',
    'emoji_channel',
    'emoji_moderator',
    'emoji_statistics',
    'emoji_annoattention',
    'emoji_owner',
    'emoji_delete',
    'emoji_circleinfo',
    'AUTHOR',
    'FLOOTER',
    'FOOTER'
]