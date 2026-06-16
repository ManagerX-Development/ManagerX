import discord
from typing import List, Tuple
from ._config import GlobalChatConfig

class MediaHandler:
    def __init__(self, config: GlobalChatConfig):
        self.config = config

    def validate_attachments(self, attachments: List[discord.Attachment]) -> Tuple[bool, str, List[discord.Attachment]]:
        if not attachments:
            return True, "", []
        if len(attachments) > self.config.MAX_ATTACHMENTS:
            return False, f"Zu viele Anhänge (max. {self.config.MAX_ATTACHMENTS})", []
        valid_attachments = []
        max_size_bytes = self.config.MAX_FILE_SIZE_MB * 1024 * 1024
        for attachment in attachments:
            if attachment.size > max_size_bytes:
                return False, f"Datei '{attachment.filename}' ist zu groß (max. {self.config.MAX_FILE_SIZE_MB}MB)", []
            file_ext = attachment.filename.split('.')[-1].lower() if '.' in attachment.filename else ''
            all_allowed = (
                self.config.ALLOWED_IMAGE_FORMATS + self.config.ALLOWED_VIDEO_FORMATS +
                self.config.ALLOWED_AUDIO_FORMATS + self.config.ALLOWED_DOCUMENT_FORMATS
            )
            if file_ext and file_ext not in all_allowed:
                return False, f"Dateiformat '.{file_ext}' nicht erlaubt", []
            valid_attachments.append(attachment)
        return True, "", valid_attachments

    def categorize_attachment(self, attachment: discord.Attachment) -> str:
        if not attachment.filename or '.' not in attachment.filename:
            return 'other'
        file_ext = attachment.filename.split('.')[-1].lower()
        if file_ext in self.config.ALLOWED_IMAGE_FORMATS:
            return 'image'
        elif file_ext in self.config.ALLOWED_VIDEO_FORMATS:
            return 'video'
        elif file_ext in self.config.ALLOWED_AUDIO_FORMATS:
            return 'audio'
        elif file_ext in self.config.ALLOWED_DOCUMENT_FORMATS:
            return 'document'
        return 'other'

    def get_attachment_icon(self, attachment: discord.Attachment) -> str:
        icons = {'image': '🖼️', 'video': '🎥', 'audio': '🎵', 'document': '📄', 'other': '📎'}
        return icons.get(self.categorize_attachment(attachment), '📎')

    def format_file_size(self, size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} GB"
