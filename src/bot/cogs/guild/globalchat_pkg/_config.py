# Copyright (c) 2025 OPPRO.NET Network

class GlobalChatConfig:
    RATE_LIMIT_MESSAGES = 15
    RATE_LIMIT_SECONDS = 60
    CACHE_DURATION = 180
    CLEANUP_DAYS = 30
    MIN_MESSAGE_LENGTH = 0
    DEFAULT_MAX_MESSAGE_LENGTH = 1900
    DEFAULT_EMBED_COLOR = '#5865F2'
    MAX_FILE_SIZE_MB = 25
    MAX_ATTACHMENTS = 10
    ALLOWED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
    ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'webm', 'avi', 'mkv']
    ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
    ALLOWED_DOCUMENT_FORMATS = ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z']
    BOT_OWNERS = [1093555256689959005, 1427994077332373554]
    DISCORD_INVITE_PATTERN = r'(?i)\b(discord\.gg|discord\.com/invite|discordapp\.com/invite)/[a-zA-Z0-9]+\b'
    URL_PATTERN = r'(?i)\bhttps?://(?:[a-zA-Z0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F]{2}))+\b'
    NSFW_KEYWORDS = [
        'nsfw', 'porn', 'sex', 'xxx', 'nude', 'hentai',
        'dick', 'pussy', 'cock', 'tits', 'ass', 'fuck'
    ]
