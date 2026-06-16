import discord
import re
from typing import Tuple, Dict
from mxmariadb import GlobalChatDatabase
from ._config import GlobalChatConfig
from ._media import MediaHandler

# Shared database instance for the validator
db = GlobalChatDatabase()

class MessageValidator:
    def __init__(self, config: GlobalChatConfig):
        self.config = config
        self.media_handler = MediaHandler(config)
        self._compile_patterns()

    def _compile_patterns(self):
        self.invite_pattern = re.compile(self.config.DISCORD_INVITE_PATTERN)
        self.url_pattern = re.compile(self.config.URL_PATTERN)

    async def validate_message(self, message: discord.Message, settings: Dict) -> Tuple[bool, str]:
        if message.author.bot:
            return False, "Bot-Nachricht"

        if await db.is_blacklisted('user', message.author.id):
            return False, "User auf Blacklist"
        if await db.is_blacklisted('guild', message.guild.id):
            return False, "Guild auf Blacklist"

        if not message.content and not message.attachments and not message.stickers:
            return False, "Leere Nachricht"

        if message.content:
            content_length = len(message.content.strip())
            if content_length < self.config.MIN_MESSAGE_LENGTH and not message.attachments and not message.stickers:
                return False, "Zu kurze Nachricht"
            max_length = settings.get('max_message_length', self.config.DEFAULT_MAX_MESSAGE_LENGTH)
            if content_length > max_length:
                return False, f"Nachricht zu lang (max. {max_length} Zeichen)"

        if message.attachments:
            valid, reason, _ = self.media_handler.validate_attachments(message.attachments)
            if not valid:
                return False, f"Ungültige Anhänge: {reason}"

        if settings.get('filter_enabled', True):
            is_filtered, filter_reason = self.check_filtered_content(message.content)
            if is_filtered:
                return False, f"Gefilterte Inhalte: {filter_reason}"

        if settings.get('nsfw_filter', True):
            if self.check_nsfw_content(message.content):
                return False, "NSFW Inhalt erkannt"

        return True, "OK"

    def check_filtered_content(self, content: str) -> Tuple[bool, str]:
        if not content:
            return False, ""
        if self.invite_pattern.search(content):
            return True, "Discord Invite"
        return False, ""

    def check_nsfw_content(self, content: str) -> bool:
        if not content:
            return False
        content_lower = content.lower()
        for keyword in self.config.NSFW_KEYWORDS:
            if re.search(r'\b' + re.escape(keyword) + r'\b', content_lower):
                return True
        return False

    def clean_content(self, content: str) -> str:
        if not content:
            return ""
        content = content.replace('@everyone', '＠everyone').replace('@here', '＠here')
        content = re.sub(r'<@&(\d+)>', r'＠role', content)
        return content
