# Copyright (c) 2025 OPPRO.NET Network
import discord
from discord.ext import commands, tasks
from discord import slash_command, Option, SlashCommandGroup
from mx_devtools.backend.database.globalchat_db import GlobalChatDatabase, db
import asyncio
import logging
import re
import time
from typing import List, Optional, Dict, Tuple
import aiohttp
import io
import json
import random
from datetime import datetime, timedelta
import ezcord
from collections import defaultdict
from discord.ui import Container

# Logger konfigurieren
logger = logging.getLogger(__name__)


class GlobalChatConfig:
    """Zentrale Konfiguration für GlobalChat"""
    RATE_LIMIT_MESSAGES = 15
    RATE_LIMIT_SECONDS = 60
    CACHE_DURATION = 180  # 3 Minuten
    CLEANUP_DAYS = 30
    MIN_MESSAGE_LENGTH = 0  # Erlaube Nachrichten ohne Text (nur Medien)
    DEFAULT_MAX_MESSAGE_LENGTH = 1900
    DEFAULT_EMBED_COLOR = '#5865F2'
    
    # Medien-Limits
    MAX_FILE_SIZE_MB = 25  # Discord-Standard
    MAX_ATTACHMENTS = 10
    ALLOWED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
    ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'webm', 'avi', 'mkv']
    ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
    ALLOWED_DOCUMENT_FORMATS = ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z']
    
    # Bot Owner IDs
    BOT_OWNERS = [1093555256689959005, 1427994077332373554]
    
    # Content Filter Patterns
    DISCORD_INVITE_PATTERN = r'(?i)\b(discord\.gg|discord\.com/invite|discordapp\.com/invite)/[a-zA-Z0-9]+\b'
    URL_PATTERN = r'(?i)\bhttps?://(?:[a-zA-Z0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F]{2}))+\b'
    
    # NSFW Keywords
    NSFW_KEYWORDS = [
        'nsfw', 'porn', 'sex', 'xxx', 'nude', 'hentai', 
        'dick', 'pussy', 'cock', 'tits', 'ass', 'fuck'
    ]


class MediaHandler:
    """Verarbeitet alle Arten von Medien und Anhängen"""
    
    def __init__(self, config: GlobalChatConfig):
        self.config = config
    
    def validate_attachments(self, attachments: List[discord.Attachment]) -> Tuple[bool, str, List[discord.Attachment]]:
        """Validiert Attachments und gibt valide zurück"""
        if not attachments:
            return True, "", []
        
        if len(attachments) > self.config.MAX_ATTACHMENTS:
            return False, f"Zu viele Anhänge (max. {self.config.MAX_ATTACHMENTS})", []
        
        valid_attachments = []
        max_size_bytes = self.config.MAX_FILE_SIZE_MB * 1024 * 1024
        
        for attachment in attachments:
            # Größe prüfen
            if attachment.size > max_size_bytes:
                return False, f"Datei '{attachment.filename}' ist zu groß (max. {self.config.MAX_FILE_SIZE_MB}MB)", []
            
            # Dateiformat prüfen
            file_ext = attachment.filename.split('.')[-1].lower() if '.' in attachment.filename else ''
            
            all_allowed = (
                self.config.ALLOWED_IMAGE_FORMATS +
                self.config.ALLOWED_VIDEO_FORMATS +
                self.config.ALLOWED_AUDIO_FORMATS +
                self.config.ALLOWED_DOCUMENT_FORMATS
            )
            
            if file_ext and file_ext not in all_allowed:
                return False, f"Dateiformat '.{file_ext}' nicht erlaubt", []
            
            valid_attachments.append(attachment)
        
        return True, "", valid_attachments
    
    def categorize_attachment(self, attachment: discord.Attachment) -> str:
        """Kategorisiert einen Anhang nach Typ"""
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
        else:
            return 'other'
    
    def get_attachment_icon(self, attachment: discord.Attachment) -> str:
        """Gibt passendes Icon für Attachment-Typ zurück"""
        category = self.categorize_attachment(attachment)
        
        icons = {
            'image': '🖼️',
            'video': '🎥',
            'audio': '🎵',
            'document': '📄',
            'other': '📎'
        }
        
        return icons.get(category, '📎')
    
    def format_file_size(self, size_bytes: int) -> str:
        """Formatiert Dateigröße leserlich"""
        for unit in ['B', 'KB', 'MB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} GB"


class MessageValidator:
    """Validiert und filtert Nachrichten"""
    
    def __init__(self, config: GlobalChatConfig):
        self.config = config
        self.media_handler = MediaHandler(config)
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Kompiliert Regex-Patterns für bessere Performance"""
        self.invite_pattern = re.compile(self.config.DISCORD_INVITE_PATTERN)
        self.url_pattern = re.compile(self.config.URL_PATTERN)
    
    def validate_message(self, message: discord.Message, settings: Dict) -> Tuple[bool, str]:
        """Hauptvalidierung für Nachrichten"""
        # Bot-Nachrichten ignorieren
        if message.author.bot:
            return False, "Bot-Nachricht"
        
        # Blacklist prüfen
        if db.is_blacklisted('user', message.author.id):
            return False, "User auf Blacklist"
        
        if db.is_blacklisted('guild', message.guild.id):
            return False, "Guild auf Blacklist"
        
        # Leere Nachrichten (ohne Text UND ohne Anhänge/Sticker)
        if not message.content and not message.attachments and not message.stickers:
            return False, "Leere Nachricht"
        
        # Nachrichtenlänge (nur wenn Text vorhanden)
        if message.content:
            content_length = len(message.content.strip())
            
            # Mindestlänge nur bei reinen Text-Nachrichten
            if content_length < self.config.MIN_MESSAGE_LENGTH and not message.attachments and not message.stickers:
                return False, "Zu kurze Nachricht"
            
            max_length = settings.get('max_message_length', self.config.DEFAULT_MAX_MESSAGE_LENGTH)
            if content_length > max_length:
                return False, f"Nachricht zu lang (max. {max_length} Zeichen)"
        
        # Attachments validieren
        if message.attachments:
            valid, reason, _ = self.media_handler.validate_attachments(message.attachments)
            if not valid:
                return False, f"Ungültige Anhänge: {reason}"
        
        # Content Filter
        if settings.get('filter_enabled', True):
            is_filtered, filter_reason = self.check_filtered_content(message.content)
            if is_filtered:
                return False, f"Gefilterte Inhalte: {filter_reason}"
        
        # NSFW Filter
        if settings.get('nsfw_filter', True):
            if self.check_nsfw_content(message.content):
                return False, "NSFW Inhalt erkannt"
        
        return True, "OK"
    
    def check_filtered_content(self, content: str) -> Tuple[bool, str]:
        """Prüft auf gefilterte Inhalte mit detailliertem Grund"""
        if not content:
            return False, ""
        
        # Discord Invites
        if self.invite_pattern.search(content):
            return True, "Discord Invite"
        
        return False, ""
    
    def check_nsfw_content(self, content: str) -> bool:
        """Erweiterte NSFW-Erkennung"""
        if not content:
            return False
        
        content_lower = content.lower()
        
        # Keyword-Check mit Wortgrenzen
        for keyword in self.config.NSFW_KEYWORDS:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, content_lower):
                return True
        
        return False
    
    def clean_content(self, content: str) -> str:
        """Bereinigt Nachrichteninhalt"""
        if not content:
            return ""
        
        # @everyone und @here neutralisieren
        content = content.replace('@everyone', '＠everyone')
        content = content.replace('@here', '＠here')
        
        # Rolle-Mentions neutralisieren
        content = re.sub(r'<@&(\d+)>', r'＠role', content)
        
        return content


class EmbedBuilder:
    """Erstellt formatierte Embeds für GlobalChat mit vollständigem Medien-Support"""
    
    def __init__(self, config: GlobalChatConfig, bot=None):
        self.config = config
        self.media_handler = MediaHandler(config)
        self.bot = bot  # Bot für Message-Fetching
    
    async def create_message_embed(self, message: discord.Message, settings: Dict, attachment_data: List[Tuple[str, bytes, str]] = None) -> Tuple[discord.Embed, List[Tuple[str, bytes]]]:
        """Erstellt ein verbessertes Embed mit vollständigem Medien-Support
        
        attachment_data: Liste von (filename, bytes, content_type) - schon heruntergeladene Dateien
        Gibt (embed, [(filename, bytes), ...]) zurück - Bytes statt discord.File!
        """
        if attachment_data is None:
            attachment_data = []
        
        content = self._clean_content(message.content)
        
        # Embed-Farbe
        embed_color = self._parse_color(settings.get('embed_color', self.config.DEFAULT_EMBED_COLOR))
        
        # Beschreibung mit stilisiertem Layout
        if content:
            description = f"{content}"
        elif message.attachments or message.stickers or attachment_data:
            description = "📎 *Medien-Nachricht*"
        else:
            description = ""
        
        # Embed erstellen
        embed = discord.Embed(
            description=description,
            color=embed_color,
            timestamp=message.created_at
        )
        
        # Author mit Badges und Username-Tag
        author_text, badges = self._build_author_info(message.author)
        
        # --- ECONOMY OVERRIDES ---
        from mx_devtools import EconomyDatabase
        eco_db = EconomyDatabase()
        overrides = eco_db.get_equipped_overrides(message.author.id)
        
        # Color Override
        if 'color' in overrides:
            embed_color = self._parse_color(overrides['color'])
            embed.color = embed_color
            
        # Emoji Override
        if 'emoji' in overrides:
            emoji = overrides['emoji']
            # Add emoji to the author name
            author_text = f"{emoji} {author_text}"
        # -------------------------

        embed.set_author(
            name=author_text,
            icon_url=message.author.display_avatar.url
        )
        
        # Thumbnail mit User-Avatar für bessere Optik
        embed.set_thumbnail(url=message.author.display_avatar.url)
        
        # Footer mit Server-Info und schönerem Layout
        footer_text = f"🌐 {message.guild.name}  •  #{message.channel.name}  •  ID:{message.id}"
        embed.set_footer(
            text=footer_text,
            icon_url=message.guild.icon.url if message.guild.icon else None
        )
        
        # Reply-Kontext hinzufügen (robust, ohne invasive Änderungen)
        if message.reference:
            try:
                # Versuche zuerst die gecachte referenzierte Nachricht
                replied_msg = message.reference.resolved

                # Falls nicht im Cache, versuche die referenzierte Nachricht aus dem referenzierten Kanal zu holen
                if not replied_msg and getattr(message.reference, 'message_id', None):
                    ref_channel = None
                    ref_chan_id = getattr(message.reference, 'channel_id', None)
                    if ref_chan_id:
                        # Versuche zuerst den Kanal vom Bot-Cache
                        ref_channel = self.bot.get_channel(ref_chan_id)
                        # Fallback auf Guild-Kanal
                        if not ref_channel and message.guild:
                            try:
                                ref_channel = message.guild.get_channel(ref_chan_id)
                            except Exception:
                                ref_channel = None
                    if not ref_channel:
                        ref_channel = message.channel

                    if ref_channel:
                        try:
                            replied_msg = await ref_channel.fetch_message(message.reference.message_id)
                        except Exception:
                            replied_msg = None

                # Wenn wir eine referenzierte Nachricht haben, bereite Vorschau vor
                if isinstance(replied_msg, discord.Message):
                    # Text-Vorschau (bevorzuge echten content)
                    preview = replied_msg.content or ""

                    # Wenn die referenzierte Nachricht das Relay-Bot-Embed ist, versuche Text aus dem Embed
                    if not preview and replied_msg.embeds:
                        try:
                            preview = replied_msg.embeds[0].description or ""
                        except Exception:
                            preview = ""

                    # Fallback auf Anhänge/Sticker
                    if not preview:
                        if replied_msg.attachments:
                            preview = f"📎 {len(replied_msg.attachments)} Datei(en)"
                        elif replied_msg.stickers:
                            preview = "🎨 Sticker"
                        else:
                            preview = "*(Leere Nachricht)*"

                    preview = self._clean_content(preview)
                    preview_short = (preview[:200] + "...") if len(preview) > 200 else preview

                    # Author bestimmen: falls die referenzierte Nachricht vom Bot ist, versuche embed.author
                    author_display = None
                    try:
                        if replied_msg.author and replied_msg.author.id == getattr(self.bot, 'user', None).id and replied_msg.embeds:
                            emb = replied_msg.embeds[0]
                            if emb.author and emb.author.name:
                                author_display = emb.author.name
                    except Exception:
                        author_display = None

                    if not author_display:
                        try:
                            author_display = replied_msg.author.display_name
                        except Exception:
                            author_display = "Unbekannter User"

                    # Herkunft (Server • #channel)
                    origin = None
                    try:
                        if getattr(replied_msg, 'guild', None) and getattr(replied_msg, 'channel', None):
                            origin = f"{replied_msg.guild.name} • #{replied_msg.channel.name}"
                    except Exception:
                        origin = None

                    reply_field = f"**{author_display}:** {preview_short}"
                    if origin:
                        reply_field += f"\n_{origin}_"

                    embed.add_field(name="↩️ Antwort (Vorschau)", value=reply_field, inline=False)
            except Exception:
                # Never fail building the embed just because reply resolution failed
                pass
        
        # Medien verarbeiten mit heruntergeladenen Dateien
        files_to_upload = await self._process_media(embed, message, attachment_data)

        # Rückgabe: Embed + Liste von discord.File Objekten
        return embed, files_to_upload
    
    async def _process_media(self, embed: discord.Embed, message: discord.Message, attachment_data: List[Tuple[str, bytes, str]] = None) -> List[Tuple[str, bytes]]:
        """Verarbeitet alle Medien-Typen mit heruntergeladenen Anhängen
        
        attachment_data: Liste von (filename, bytes, content_type) - bereits heruntergeladen
        Gibt Liste von (filename, bytes) zurück - NOT discord.File!
        """
        if attachment_data is None:
            attachment_data = []
        
        attachment_bytes: List[Tuple[str, bytes]] = []

        # === HERUNTERGELADENE ATTACHMENTS ===
        if attachment_data:
            attachment_bytes.extend(self._process_downloaded_attachments(embed, attachment_data))

        # === STICKERS ===
        if message.stickers:
            self._process_stickers(embed, message.stickers)

        # === ORIGINAL EMBEDS (z.B. von Links) ===
        if message.embeds:
            self._process_embeds(embed, message.embeds)

        return attachment_bytes
    
    def _process_downloaded_attachments(self, embed: discord.Embed, attachment_data: List[Tuple[str, bytes, str]]) -> List[Tuple[str, bytes]]:
        """Verarbeitet heruntergeladene Anhänge und gibt (filename, bytes) zurück
        
        attachment_data: [(filename, bytes_data, content_type), ...]
        Gibt [(filename, bytes), ...] zurück - NICHT discord.File!
        """
        attachment_bytes: List[Tuple[str, bytes]] = []
        
        # Kategorisiere nach Typ
        images = []
        videos = []
        audios = []
        documents = []
        others = []
        
        for filename, data, content_type in attachment_data:
            # Bestimme Dateityp anhand von content_type und Dateiendung
            category = self._get_attachment_category(filename, content_type)
            
            if category == 'image':
                images.append((filename, data))
            elif category == 'video': # HIER wurde der Code vervollständigt
                videos.append((filename, data))
            elif category == 'audio':
                audios.append((filename, data))
            elif category == 'document':
                documents.append((filename, data))
            else:
                others.append((filename, data)) # Vervollständigt

        # === IMAGE (NUR das erste Bild als embed.image) ===
        if images:
            # Das erste Bild als Embed-Bild setzen
            embed.set_image(url=f"attachment://{images[0][0]}")
            # Alle Bilder für den Upload vorbereiten
            for filename, data in images:
                attachment_bytes.append((filename, data))

            if len(images) > 1:
                # Füge einen Hinweis hinzu, dass weitere Bilder angehängt sind
                embed.add_field(
                    name="🖼️ Weitere Bilder",
                    value=f"_{len(images)-1} zusätzliche Bilder angehängt._",
                    inline=False
                )

        # === VIDEOS ===
        if videos:
            video_links = []
            for video_name, video_data in videos:
                size = len(video_data)
                size_str = self.media_handler.format_file_size(size)
                video_links.append(f"🎥 {video_name} ({size_str})")
                attachment_bytes.append((video_name, video_data))
            
            if video_links:
                embed.add_field(
                    name="🎬 Videos",
                    value="\n".join(video_links[:3]), # Max 3
                    inline=False
                )

        # === AUDIO ===
        if audios:
            audio_links = []
            for audio_name, audio_data in audios:
                size = len(audio_data)
                size_str = self.media_handler.format_file_size(size)
                audio_links.append(f"🎵 {audio_name} ({size_str})")
                attachment_bytes.append((audio_name, audio_data))

            if audio_links:
                embed.add_field(
                    name="🎧 Audio-Dateien",
                    value="\n".join(audio_links[:3]), # Max 3
                    inline=False
                )

        # === DOKUMENTE ===
        if documents:
            doc_links = []
            for doc_name, doc_data in documents:
                size = len(doc_data)
                size_str = self.media_handler.format_file_size(size)
                doc_links.append(f"📄 {doc_name} ({size_str})")
                attachment_bytes.append((doc_name, doc_data))
            
            if doc_links:
                embed.add_field(
                    name="📄 Dokumente",
                    value="\n".join(doc_links[:3]), # Max 3
                    inline=False
                )
        
        # === SONSTIGE ===
        if others:
            other_links = []
            for other_name, other_data in others:
                size = len(other_data)
                size_str = self.media_handler.format_file_size(size)
                other_links.append(f"📎 {other_name} ({size_str})")
                attachment_bytes.append((other_name, other_data))
            
            if other_links:
                embed.add_field(
                    name="📎 Sonstige",
                    value="\n".join(other_links[:3]), # Max 3
                    inline=False
                )
                
        return attachment_bytes # Wichtig: bytes zurückgeben
    
    def _process_stickers(self, embed: discord.Embed, stickers: List[discord.StickerItem]):
        """Verarbeitet Discord Sticker"""
        if not stickers:
            return
        
        sticker_info = []
        for sticker in stickers:
            sticker_type = "Standard" if sticker.url.endswith('.png') else "Animiert"
            sticker_info.append(f"🎨 **{sticker.name}** ({sticker_type})")
        
        embed.add_field(
            name="🎨 Sticker",
            value="\n".join(sticker_info[:3]),
            inline=False
        )

        # Versuche, das erste Bild (falls vorhanden) als Thumbnail zu setzen
        if stickers[0].format.name in ['PNG', 'LOTTIE']:
            embed.set_thumbnail(url=stickers[0].url)
            
    def _process_embeds(self, main_embed: discord.Embed, embeds: List[discord.Embed]):
        """Verarbeitet Original-Embeds (z.B. Link-Vorschauen)"""
        if not embeds:
            return
        
        link_embeds = []
        for embed in embeds:
            # Nur Embeds mit Titeln oder Beschreibungen, die keine eigenen Attachments sind, verarbeiten
            if embed.type not in ['image', 'video', 'gifv'] and (embed.title or embed.description or embed.url):
                
                title = embed.title or "Unbekannter Link"
                description = (embed.description[:100] + "...") if embed.description else ""
                url = embed.url or ""
                
                link_embeds.append(f"**[{title}]({url})**\n_{description}_")

        if link_embeds:
            main_embed.add_field(
                name="🔗 Verlinkte Inhalte",
                value="\n\n".join(link_embeds),
                inline=False
            )

    def _get_attachment_category(self, filename: str, content_type: str) -> str:
        """Hilfsfunktion zur Kategorisierung basierend auf Name und Content-Type"""
        if content_type.startswith('image/'):
            return 'image'
        elif content_type.startswith('video/'):
            return 'video'
        elif content_type.startswith('audio/'):
            return 'audio'
        
        # Fallback auf Dateiendung
        if not filename or '.' not in filename:
            return 'other'
            
        file_ext = filename.split('.')[-1].lower()
        if file_ext in self.config.ALLOWED_IMAGE_FORMATS:
            return 'image'
        elif file_ext in self.config.ALLOWED_VIDEO_FORMATS:
            return 'video'
        elif file_ext in self.config.ALLOWED_AUDIO_FORMATS:
            return 'audio'
        elif file_ext in self.config.ALLOWED_DOCUMENT_FORMATS:
            return 'document'
        else:
            return 'other'

    def _clean_content(self, content: str) -> str:
        """Bereinigt Nachrichteninhalt"""
        if not content:
            return ""
        content = content.replace('@everyone', '＠everyone')
        content = content.replace('@here', '＠here')
        content = re.sub(r'<@&(\d+)>', r'＠role', content)
        return content.strip()
    
    def _parse_color(self, color_hex: str) -> discord.Color:
        """Parst Hex-Farbe zu discord.Color"""
        try:
            color_hex = color_hex.lstrip('#')
            return discord.Color(int(color_hex, 16))
        except (ValueError, TypeError):
            return discord.Color.blurple()
            
    def _build_author_info(self, author: discord.Member) -> Tuple[str, List[str]]:
        """Baut Author-Text mit Badges – schöneres Format"""
        badges = []
        roles = []
        # Bot Owner
        if author.id in self.config.BOT_OWNERS:
            badges.append("👑")
            roles.append("Bot Owner")
        # Server Admin/Mod
        if author.guild_permissions.administrator:
            badges.append("⚡")
            roles.append("Admin")
        elif author.guild_permissions.manage_guild:
            badges.append("🔧")
            roles.append("Mod")
        
        # Nitro/Booster Badge
        if hasattr(author, 'premium_since') and author.premium_since:
            badges.append("💎")
            roles.append("Booster")
            
        badge_text = " ".join(badges)
        display = author.display_name
        
        # Format: "👑 ⚡ DisplayName (@username)"
        if badge_text:
            author_text = f"{badge_text}  {display}  (@{author.name})"
        else:
            author_text = f"{display}  (@{author.name})"
        
        # Hinzufügen von Discord System Badges (z.B. Bot, Verified Bot)
        if author.bot:
            author_text += " ✦ BOT"

        return author_text, roles


class GlobalChatSender:
    """Verantwortlich für das Senden der Nachricht an alle verbundenen Kanäle"""
    def __init__(self, bot, config: GlobalChatConfig, embed_builder: EmbedBuilder):
        self.bot = bot
        self.config = config
        self.embed_builder = embed_builder
        self._cached_channels: Optional[List[int]] = None

    async def _get_all_active_channels(self) -> List[int]:
        """Ruft alle aktiven Channel-IDs ab, nutzt den Cache"""
        if self._cached_channels is None:
            self._cached_channels = await self._fetch_all_channels()
        return self._cached_channels

    async def _fetch_all_channels(self) -> List[int]:
            """Holt Channel IDs direkt aus der Datenbank"""
            try:
                channel_ids = db.get_all_channels()
                return channel_ids
            except Exception as e:
                logger.error(f"❌ Fehler beim Abrufen aller Channel-IDs: {e}", exc_info=True)
                return []

    async def _send_to_channel(self, channel_id: int, embed: discord.Embed, attachment_bytes: List[Tuple[str, bytes]]) -> bool:
        """Sendet die Embed-Nachricht an einen spezifischen Channel mit Error-Handling
        attachment_bytes: Liste von (filename, bytes) - wird zu discord.File konvertiert
        Wichtig: Raw bytes, nicht discord.File, da File-Streams verbraucht sind!
        """
        try:
            channel = self.bot.get_channel(channel_id)
            if not channel:
                try:
                    channel = await self.bot.fetch_channel(channel_id)
                except Exception:
                    logger.warning(f"⚠️ Channel {channel_id} konnte nicht abgerufen werden.")
                    return False
            
            # Permissions prüfen
            if hasattr(channel, 'guild') and channel.guild:
                perms = channel.permissions_for(channel.guild.me)
                if not perms.send_messages or not perms.embed_links:
                    logger.warning(f"⚠️ Keine Permissions in {channel_id} ({channel.guild.name})")
                    return False
            
            # Erstelle NEUE discord.File Objekte für diesen Channel (wichtig!)
            # Jeder Channel bekommt seine eigenen frischen Files!
            files = []
            if attachment_bytes:
                for filename, data in attachment_bytes:
                    try:
                        files.append(discord.File(io.BytesIO(data), filename=filename))
                    except Exception as e:
                        logger.warning(f"⚠️ Error creating file {filename}: {e}")

            # Sende mit Retry-Logik
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    if files:
                        await channel.send(embed=embed, files=files)
                    else:
                        await channel.send(embed=embed)
                    return True
                except (ConnectionResetError, aiohttp.ClientConnectorError, asyncio.TimeoutError) as e:
                    logger.warning(f"❌ Sendefehler (Retry {attempt+1}/{max_retries}) in {channel_id}: {e}")
                    await asyncio.sleep(1 + attempt * 2)
                except discord.Forbidden:
                    logger.warning(f"❌ Bot hat Senderechte in {channel_id} verloren. Enferne aus Cache.")
                    if channel_id in self._cached_channels:
                        self._cached_channels.remove(channel_id)
                    return False
                except Exception as e:
                    logger.error(f"❌ Unerwarteter Sendefehler in {channel_id}: {e}")
                    return False
            
            # Wenn alle Retries fehlschlagen
            logger.error(f"❌ Senden nach {max_retries} Retries in {channel_id} fehlgeschlagen.")
            return False

        except Exception as e:
            logger.error(f"❌ Generischer Fehler im _send_to_channel: {e}", exc_info=True)
            return False

    async def send_global_message(self, message: discord.Message, attachment_data: List[Tuple[str, bytes, str]] = None) -> Tuple[int, int]:
        """Sendet eine Nachricht global an alle verbundenen Channels"""
        settings = db.get_guild_settings(message.guild.id)
        
        embed, files_to_upload = await self.embed_builder.create_message_embed(message, settings, attachment_data)
        
        active_channels = await self._get_all_active_channels()
        successful_sends = 0
        failed_sends = 0

        # Sende an ALLE aktiven Channels (inkl. Ursprungskanal – Original wird gelöscht)
        tasks = []
        for channel_id in active_channels:
            tasks.append(self._send_to_channel(channel_id, embed, files_to_upload))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if result is True:
                successful_sends += 1
            else:
                failed_sends += 1
                if isinstance(result, Exception):
                    logger.error(f"❌ Task-Fehler beim Senden: {result}")
        
        return successful_sends, failed_sends

    async def send_global_broadcast_message(self, embed: discord.Embed) -> Tuple[int, int]:
        """Sendet einen Broadcast an alle Kanäle"""
        active_channels = await self._get_all_active_channels()
        successful_sends = 0
        failed_sends = 0

        tasks = []
        for channel_id in active_channels:
            tasks.append(self._send_to_channel(channel_id, embed, []))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if result is True:
                successful_sends += 1
            else:
                failed_sends += 1
        
        return successful_sends, failed_sends


class GlobalChat(ezcord.Cog):
    """Haupt-Cog für das GlobalChat-System"""

    globalchat = SlashCommandGroup("globalchat", "GlobalChat Verwaltung")
    

    def __init__(self, bot):
        self.bot = bot
        self.config = GlobalChatConfig()
        self.validator = MessageValidator(self.config)
        self.embed_builder = EmbedBuilder(self.config, bot)
        self.message_cooldown = commands.CooldownMapping.from_cooldown(
            self.config.RATE_LIMIT_MESSAGES, 
            self.config.RATE_LIMIT_SECONDS, 
            commands.BucketType.user
        )
        self._cached_channels = None  # Wird bei der ersten Nachricht geladen
        self.sender = GlobalChatSender(self.bot, self.config, self.embed_builder)
        self.cleanup_task.start()

    @tasks.loop(hours=12)
    async def cleanup_task(self):
            """Task zur Bereinigung abgelaufener Blacklist-Einträge und Cache-Aktualisierung"""
            # db.delete_expired_blacklist_entries() <--- DIESE ZEILE AUSKOMMENTIEREN
            # logger.info("🗑️ GlobalChat: Abgelaufene Blacklist-Einträge bereinigt.")
            
            # Cache neu laden
            await self.sender._get_all_active_channels()
            logger.info("🧠 GlobalChat: Channel-Cache neu geladen.")

    @ezcord.Cog.listener()
    async def on_message(self, message: discord.Message):
        """Haupt-Listener für eingehende GlobalChat-Nachrichten"""
        if not message.guild or message.author.bot:
            return

        # Prüfen ob Channel ein GlobalChat-Channel ist
        global_chat_channel_id = db.get_globalchat_channel(message.guild.id)
        if message.channel.id != global_chat_channel_id:
            return

        # Guild-Settings laden
        settings = db.get_guild_settings(message.guild.id)

        # Message validieren
        is_valid, reason = self.validator.validate_message(message, settings)
        if not is_valid:
            logger.debug(f"❌ Nachricht abgelehnt: {reason} (User: {message.author.id})")
            
            # User benachrichtigen bei bestimmten Gründen
            if any(keyword in reason for keyword in ["Blacklist", "NSFW", "Gefilterte", "Ungültige Anhänge", "zu groß"]):
                try:
                    await message.add_reaction("❌")
                    # Info-Nachricht für spezifische Fehler
                    if "Ungültige Anhänge" in reason or "zu groß" in reason:
                        info_msg = await message.reply(
                            f"❌ **Fehler:** {reason}\n"
                            f"**Max. Größe:** {self.config.MAX_FILE_SIZE_MB}MB pro Datei\n"
                            f"**Max. Anhänge:** {self.config.MAX_ATTACHMENTS}",
                            delete_after=7
                        )
                    await asyncio.sleep(2)
                    await message.delete()
                except (discord.Forbidden, discord.NotFound):
                    pass # Kann Nachricht nicht löschen/reagieren
                return

        # --- ECONOMY: Award Coins ---
        from mx_devtools import EconomyDatabase
        eco_db = EconomyDatabase()
        # Award 5-15 coins per message with a simple cooldown check
        user_info = eco_db.get_user_economy_info(message.author.id)
        last_msg_raw = user_info.get('last_message_at')
        can_earn = True
        if last_msg_raw:
            try:
                # Handle common SQLite formats
                try:
                    last_dt = datetime.strptime(last_msg_raw, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    last_dt = datetime.fromisoformat(last_msg_raw)
                
                if datetime.utcnow() < last_dt + timedelta(seconds=30):
                    can_earn = False
            except Exception: pass
            
        if can_earn:
            amount = random.randint(5, 15)
            eco_db.add_global_coins(message.author.id, amount)
            eco_db.update_last_message(message.author.id)
        # ----------------------------

        # Rate Limiting prüfen
        bucket = self.message_cooldown.get_bucket(message)
        retry_after = bucket.update_rate_limit()
        if retry_after:
            try:
                await message.add_reaction("⏰")
                await asyncio.sleep(2)
                await message.delete()
                logger.debug(f"⏰ Nachricht von {message.author.id} wegen Rate Limit entfernt.")
            except (discord.Forbidden, discord.NotFound):
                pass
            return

        # === Medien herunterladen (wenn vorhanden) ===
        attachment_data: List[Tuple[str, bytes, str]] = []
        if message.attachments:
            try:
                await message.channel.trigger_typing()
                for attachment in message.attachments:
                    # Maximal 25MB (Discord-Limit)
                    if attachment.size <= self.config.MAX_FILE_SIZE_MB * 1024 * 1024:
                        data = await attachment.read()
                        attachment_data.append((attachment.filename, data, attachment.content_type))
            except Exception as e:
                logger.error(f"❌ Fehler beim Herunterladen von Attachments: {e}")
                # Wenn Download fehlschlägt, Nachricht trotzdem ohne Medien senden
                attachment_data = []

        # Ursprüngliche Nachricht IMMER löschen (wird als Embed neu gepostet)
        try:
            await message.delete()
        except discord.Forbidden:
            logger.warning(f"⚠️ Keine Permissions zum Löschen der Original-Nachricht in {message.channel.id}")
        except discord.NotFound:
            pass

        # Nachricht als Embed an alle Channels senden (inkl. eigenen)
        successful, failed = await self.sender.send_global_message(message, attachment_data)
        
        logger.info(f"🌍 GlobalChat: Nachricht von {message.guild.name} | User: {message.author.name} | ✅ {successful} | ❌ {failed}")


    # ==================== Slash Commands ====================

    @globalchat.command(
        name="setup", 
        description="Richtet einen GlobalChat-Channel ein"
    )
    async def setup_globalchat(
        self, 
        ctx: discord.ApplicationContext, 
        channel: discord.TextChannel = Option(discord.TextChannel, "Der GlobalChat-Channel", required=True)
    ):
        """Setup-Command für GlobalChat"""
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        # Bot Permissions prüfen
        bot_perms = channel.permissions_for(ctx.guild.me)
        missing_perms = []
        if not bot_perms.send_messages: missing_perms.append("Nachrichten senden")
        if not bot_perms.manage_messages: missing_perms.append("Nachrichten verwalten")
        if not bot_perms.embed_links: missing_perms.append("Links einbetten")
        if not bot_perms.read_message_history: missing_perms.append("Nachrichten-Historie lesen")
        if not bot_perms.attach_files: missing_perms.append("Dateien anhängen") # Wichtig für Medien

        if missing_perms:
            perms_list = "\n".join([f"• {p}" for p in missing_perms])
            await ctx.respond(
                f"❌ Mir fehlen wichtige Berechtigungen in {channel.mention}:\n{perms_list}", 
                ephemeral=True
            )
            return

        try:
            db.set_globalchat_channel(ctx.guild.id, channel.id)
            
            # Cache aktualisieren
            self.sender._cached_channels = await self.sender._fetch_all_channels()

            # UI Container für eine schönere Antwort (falls vorhanden)
            container = Container()

            status_text = f"✅ **GlobalChat eingerichtet!**\n\n"
            status_text += f"Der GlobalChat ist nun in {channel.mention} aktiv.\n"
            status_text += f"Aktuell verbunden: **{len(self.sender._cached_channels)}** Server."

            container.add_text(status_text)
            container.add_separator()
            
            # Feature-Liste
            feature_text = (
                "**Unterstützte Features:**\n"
                "• 🖼️ Bilder, 🎥 Videos, 🎵 Audio\n"
                "• 📄 Dokumente (Office, PDF, Archive)\n"
                "• 🎨 Discord Sticker\n"
                "• 🔗 Automatische Link-Previews\n"
                "• ↩️ Reply auf andere Nachrichten\n\n"
                "**Nächste Schritte:**\n"
                "• `/globalchat settings` - Einstellungen anpassen\n"
                "• `/globalchat stats` - Statistiken anzeigen\n"
                "• `/globalchat media-info` - Medien-Limits anzeigen"
            )
            container.add_text(feature_text)

            view = discord.ui.DesignerView(container, timeout=None)
            await ctx.respond(view=view, ephemeral=True)

        except Exception as e:
            logger.error(f"❌ Setup-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(
        name="remove", 
        description="Entfernt den GlobalChat-Channel"
    )
    async def remove_globalchat(self, ctx: discord.ApplicationContext):
        """Entfernt GlobalChat vom Server"""
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        # Prüfen ob Channel existiert
        channel_id = db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        try:
            db.set_globalchat_channel(ctx.guild.id, None)
            
            # Cache aktualisieren
            self.sender._cached_channels = await self.sender._fetch_all_channels()

            await ctx.respond(
                f"✅ **GlobalChat entfernt!**\n\n"
                f"Der GlobalChat wurde von diesem Server entfernt.\n"
                f"Es sind nun noch **{len(self.sender._cached_channels)}** Server verbunden.",
                ephemeral=True
            )
        except Exception as e:
            logger.error(f"❌ Remove-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(
        name="settings", 
        description="Verwaltet Server-spezifische GlobalChat-Einstellungen"
    )
    async def settings_globalchat(
        self, 
        ctx: discord.ApplicationContext,
        filter_enabled: Optional[bool] = Option(bool, "Content-Filter aktivieren/deaktivieren (Invites, etc.)", required=False),
        nsfw_filter: Optional[bool] = Option(bool, "NSFW-Filter aktivieren/deaktivieren", required=False),
        embed_color: Optional[str] = Option(str, "Hex-Farbcode für Embeds (z.B. #FF00FF)", required=False),
        max_message_length: Optional[int] = Option(
            int, 
            "Maximale Nachrichtenlänge", 
            required=False, 
            min_value=50, 
            max_value=2000
        )
    ):
        """Verwaltet Server-spezifische Einstellungen"""
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        # Prüfen ob GlobalChat aktiv
        if not db.get_globalchat_channel(ctx.guild.id):
            await ctx.respond(
                "❌ Dieser Server nutzt GlobalChat nicht!\n"
                "Nutze `/globalchat setup` zuerst.", 
                ephemeral=True
            )
            return

        updated = []
        # Filter aktivieren/deaktivieren
        if filter_enabled is not None:
            if db.update_guild_setting(ctx.guild.id, 'filter_enabled', filter_enabled):
                updated.append(f"Content-Filter: {'✅ An' if filter_enabled else '❌ Aus'}")

        if nsfw_filter is not None:
            if db.update_guild_setting(ctx.guild.id, 'nsfw_filter', nsfw_filter):
                updated.append(f"NSFW-Filter: {'✅ An' if nsfw_filter else '❌ Aus'}")

        if embed_color:
            # Hex-Validierung
            if not re.match(r'^#[0-9a-fA-F]{6}$', embed_color):
                await ctx.respond("❌ Ungültiger Hex-Farbcode. Erwarte z.B. `#5865F2`.", ephemeral=True)
                return
            if db.update_guild_setting(ctx.guild.id, 'embed_color', embed_color):
                updated.append(f"Embed-Farbe: `{embed_color}`")

        if max_message_length is not None:
            if db.update_guild_setting(ctx.guild.id, 'max_message_length', max_message_length):
                updated.append(f"Max. Länge: **{max_message_length}** Zeichen")

        if not updated:
            await ctx.respond("ℹ️ Keine Änderungen vorgenommen.", ephemeral=True)
            return

        # Erfolgs-Embed
        embed = discord.Embed(
            title="✅ GlobalChat Einstellungen aktualisiert",
            description="\n".join(updated),
            color=discord.Color.green()
        )
        await ctx.respond(embed=embed, ephemeral=True)


    @globalchat.command(
        name="ban", 
        description="🔨 Bannt einen User oder Server vom GlobalChat"
    )
    async def globalchat_ban(
        self, 
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers (Guild-ID)", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True),
        reason: str = Option(str, "Grund für den Ban", required=True),
        duration: Optional[int] = Option(int, "Dauer in Stunden (optional, permanent wenn leer)", required=False)
    ):
        """Bannt eine Entität aus dem GlobalChat"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return

        # Ban ausführen
        try:
            success = db.add_to_blacklist(
                entity_type, 
                entity_id_int, 
                reason, 
                ctx.author.id, 
                duration
            )
            if not success:
                await ctx.respond("❌ Fehler beim Bannen!", ephemeral=True)
                return

            # Success-Response
            duration_text = f"{duration} Stunden" if duration else "Permanent"
            embed = discord.Embed(
                title="🔨 GlobalChat-Ban verhängt",
                color=discord.Color.red(),
                timestamp=datetime.utcnow()
            )
            embed.add_field(name="Typ", value=entity_type.title(), inline=True)
            embed.add_field(name="ID", value=f"`{entity_id_int}`", inline=True)
            embed.add_field(name="Dauer", value=duration_text, inline=True)
            embed.add_field(name="Grund", value=reason, inline=False)
            embed.add_field(name="Von", value=ctx.author.mention, inline=True)
            
            if duration:
                expires = datetime.utcnow() + timedelta(hours=duration)
                embed.add_field(
                    name="Läuft ab", 
                    value=f"<t:{int(expires.timestamp())}:R>", 
                    inline=True
                )
            
            await ctx.respond(embed=embed)
            logger.info(
                f"🔨 Ban: {entity_type} {entity_id_int} | Grund: {reason} | Dauer: {duration_text} | Von: {ctx.author.id}"
            )

        except Exception as e:
            logger.error(f"❌ Ban-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten beim Bannen!", ephemeral=True)


    @globalchat.command(
        name="unban", 
        description="🔓 Entfernt einen User oder Server von der GlobalChat-Blacklist"
    )
    async def globalchat_unban(
        self, 
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True)
    ):
        """Entfernt eine Entität von der GlobalChat Blacklist"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return
            
        try:
            if not db.is_blacklisted(entity_type, entity_id_int):
                await ctx.respond(f"ℹ️ {entity_type.title()} `{entity_id_int}` ist nicht auf der Blacklist.", ephemeral=True)
                return

            if db.remove_from_blacklist(entity_type, entity_id_int):
                embed = discord.Embed(
                    title="🔓 GlobalChat-Unban erfolgreich",
                    description=f"{entity_type.title()} mit ID `{entity_id_int}` wurde von der Blacklist entfernt.",
                    color=discord.Color.green(),
                    timestamp=datetime.utcnow()
                )
                await ctx.respond(embed=embed)
                logger.info(f"🔓 Unban: {entity_type} {entity_id_int} | Von: {ctx.author.id}")
            else:
                await ctx.respond("❌ Fehler beim Entfernen von der Blacklist!", ephemeral=True)

        except Exception as e:
            logger.error(f"❌ Unban-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten beim Unbannen!", ephemeral=True)


    @globalchat.command(
        name="info", 
        description="Zeigt Informationen über den GlobalChat"
    )
    async def globalchat_info(self, ctx: discord.ApplicationContext):
        """Zeigt allgemeine Informationen"""
        active_servers = await self.sender._get_all_active_channels()
        
        embed = discord.Embed(
            title="🌍 GlobalChat - Vollständiger Medien-Support",
            description=(
                "Ein serverübergreifendes Chat-System mit vollständigem Medien-Support.\n\n"
                f"**📊 Aktuell verbunden:** **{len(active_servers)}** Server\n\n"
                "**🎯 Hauptfeatures:**\n"
                "• Nachrichten werden an alle verbundenen Server gesendet\n"
                "• Vollständiger Medien-Support (Bilder, Videos, Audio, Dokumente)\n"
                "• Discord Sticker und Link-Previews\n"
                "• Reply-Unterstützung mit Kontext\n"
                "• Automatische Moderation und Filter\n"
                "• Rate-Limiting gegen Spam\n"
                "• Individuelle Server-Einstellungen"
            ),
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        
        embed.add_field(
            name="📁 Unterstützte Medien (Details: `/globalchat media-info`)",
            value=(
                "• 🖼️ Bilder\n"
                "• 🎥 Videos\n"
                "• 🎵 Audio\n"
                "• 📄 Dokumente (PDF, Office, Archive)"
            ),
            inline=True
        )

        embed.add_field(
            name="🛡️ Moderation",
            value=(
                f"• **Content-Filter:** {db.get_guild_settings(ctx.guild.id).get('filter_enabled', True) and '✅ An' or '❌ Aus'}\n"
                f"• **NSFW-Filter:** {db.get_guild_settings(ctx.guild.id).get('nsfw_filter', True) and '✅ An' or '❌ Aus'}\n"
                f"• **Nachrichtenlänge:** {db.get_guild_settings(ctx.guild.id).get('max_message_length', self.config.DEFAULT_MAX_MESSAGE_LENGTH)} Zeichen\n"
            ),
            inline=True
        )
        
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(
        name="stats", 
        description="Zeigt GlobalChat-Statistiken"
    )
    async def globalchat_stats(self, ctx: discord.ApplicationContext):
        """Zeigt Statistiken (z.B. Blacklist-Einträge)"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        user_bans, guild_bans = db.get_blacklist_stats()
        active_servers = await self.sender._get_all_active_channels()

        embed = discord.Embed(
            title="📊 GlobalChat System-Statistiken",
            color=discord.Color.gold(),
            timestamp=datetime.utcnow()
        )

        embed.add_field(name="🌍 Verbundene Server", value=f"**{len(active_servers)}**", inline=True)
        embed.add_field(name="👥 Gebannte User", value=f"**{user_bans}**", inline=True)
        embed.add_field(name="🛡️ Gebannte Server", value=f"**{guild_bans}**", inline=True)
        embed.add_field(name="⏳ Cache-Dauer", value=f"{self.config.CACHE_DURATION} Sekunden", inline=True)
        embed.add_field(name="📜 Protokoll Bereinigung", value=f"Alle {self.config.CLEANUP_DAYS} Tage", inline=True)
        embed.add_field(
            name="⏰ Rate-Limit", 
            value=f"{self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden", 
            inline=True
        )

        await ctx.respond(embed=embed, ephemeral=True)


    @globalchat.command(
        name="media-info", 
        description="Zeigt Details zu Medien-Limits und erlaubten Formaten"
    )
    async def globalchat_media_info(self, ctx: discord.ApplicationContext):
        """Zeigt Medien-Limits und unterstützte Formate"""
        embed = discord.Embed(
            title="📁 GlobalChat Medien-Limits & Formate",
            description="Details zu den maximal erlaubten Dateigrößen und unterstützten Formaten.",
            color=discord.Color.purple(),
            timestamp=datetime.utcnow()
        )

        # Limits
        embed.add_field(
            name="⚠️ Wichtige Limits",
            value=(
                f"• **Max. {self.config.MAX_ATTACHMENTS} Anhänge** pro Nachricht\n"
                f"• **Max. {self.config.MAX_FILE_SIZE_MB} MB** pro Datei (Discord-Limit)\n"
                f"• **Max. {self.config.DEFAULT_MAX_MESSAGE_LENGTH} Zeichen** Textlänge\n"
                f"• **Rate-Limit:** {self.config.RATE_LIMIT_MESSAGES} Nachrichten pro {self.config.RATE_LIMIT_SECONDS} Sekunden"
            ),
            inline=False
        )
        
        # Unterstützte Formate
        embed.add_field(
            name="🖼️ Bilder",
            value=", ".join(self.config.ALLOWED_IMAGE_FORMATS).upper(),
            inline=True
        )
        embed.add_field(
            name="🎥 Videos",
            value=", ".join(self.config.ALLOWED_VIDEO_FORMATS).upper(),
            inline=True
        )
        embed.add_field(
            name="🎵 Audio",
            value=", ".join(self.config.ALLOWED_AUDIO_FORMATS).upper(),
            inline=True
        )
        embed.add_field(
            name="📄 Dokumente/Archive",
            value=", ".join(self.config.ALLOWED_DOCUMENT_FORMATS).upper(),
            inline=False
        )

        await ctx.respond(embed=embed, ephemeral=True)


    @globalchat.command(
        name="help", 
        description="Zeigt die Hilfe-Seite für GlobalChat"
    )
    async def globalchat_help(self, ctx: discord.ApplicationContext):
        """Zeigt eine Übersicht aller verfügbaren Commands und Features."""
        embed = discord.Embed(
            title="❓ GlobalChat Hilfe & Übersicht",
            description="Übersicht aller verfügbaren Commands und Features.",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )

        # Setup & Verwaltung
        embed.add_field(
            name="⚙️ Setup & Verwaltung",
            value=(
                "`/globalchat setup` - Channel einrichten\n"
                "`/globalchat remove` - Channel entfernen\n"
                "`/globalchat settings` - Einstellungen anpassen"
            ),
            inline=False
        )

        # Informationen
        embed.add_field(
            name="📊 Informationen",
            value=(
                "`/globalchat info` - Allgemeine Infos\n"
                "`/globalchat stats` - Statistiken anzeigen\n"
                "`/globalchat media-info` - Medien-Details\n"
                "`/globalchat help` - Diese Hilfe"
            ),
            inline=False
        )
        
        # Moderation (Admin) - Nur für Bot Owner
        if ctx.author.id in self.config.BOT_OWNERS:
            embed.add_field(
                name="🛡️ Moderation (Bot Owner)",
                value=(
                    "`/globalchat ban` - User/Server bannen\n"
                    "`/globalchat unban` - User/Server entbannen"
                ),
                inline=False
            )

        # Test & Debug (Admin)
        if ctx.author.id in self.config.BOT_OWNERS:
            embed.add_field(
                name="🧪 Test & Debug (Bot Owner)",
                value=(
                    "`/globalchat test-media` - Medien-Test\n"
                    "`/globalchat broadcast` - Nachricht an alle senden\n"
                    "`/globalchat reload-cache` - Cache neu laden\n"
                    "`/globalchat debug` - Debug-Info"
                ),
                inline=False
            )
        
        await ctx.respond(embed=embed, ephemeral=True)
        

    @globalchat.command(
        name="test-media", 
        description="🧪 Test-Command für Medien-Upload und -Anzeige"
    )
    async def globalchat_test_media(self, ctx: discord.ApplicationContext):
        """Zeigt Anweisungen für den Medien-Test"""
        channel_id = db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        embed = discord.Embed(
            title="🧪 GlobalChat Medien-Test",
            description=(
                "Dieser Test zeigt dir, welche Medien-Typen erfolgreich übermittelt werden können.\n\n"
                "**Unterstützte Medien:**\n"
                "• Bilder, Videos, Audio, Dokumente\n"
                "• Discord Sticker\n"
                "• Antworten auf andere Nachrichten\n\n"
                "**So testest du:**\n"
                f"1. Gehe zu <#{channel_id}> und sende eine Nachricht mit Anhängen.\n"
                "2. Die Nachricht erscheint auf allen verbundenen Servern.\n\n"
                "Probiere verschiedene Kombinationen aus! (Mehrere Dateien, Sticker + Text, Reply + Datei)"
            ),
            color=discord.Color.green(),
            timestamp=datetime.utcnow()
        )
        
        embed.add_field(
            name="📊 Aktuelle Limits",
            value=(
                f"• Max. {self.config.MAX_ATTACHMENTS} Anhänge\n"
                f"• Max. {self.config.MAX_FILE_SIZE_MB} MB pro Datei\n"
                f"• {self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden"
            ),
            inline=True
        )
        
        embed.add_field(
            name="✅ Unterstützte Formate",
            value=(
                "Bilder, Videos, Audio,\n"
                "Dokumente, Archive,\n"
                "Office-Dateien, PDFs"
            ),
            inline=True
        )
        
        embed.set_footer(text=f"Test von {ctx.author}", icon_url=ctx.author.display_avatar.url)
        
        await ctx.respond(embed=embed, ephemeral=True)


    @globalchat.command(
        name="broadcast", 
        description="📢 Sendet eine Nachricht an alle verbundenen GlobalChat-Server"
    )
    async def globalchat_broadcast(
        self, 
        ctx: discord.ApplicationContext,
        title: str = Option(str, "Der Titel der Broadcast-Nachricht", required=True),
        message: str = Option(str, "Die Nachricht selbst", required=True)
    ):
        """Sendet einen Broadcast (nur Bot Owner)"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return
            
        await ctx.defer(ephemeral=True)

        try:
            # Broadcast Embed erstellen
            embed = discord.Embed(
                title=f"📢 GlobalChat Broadcast: {title}",
                description=message,
                color=discord.Color.red(),
                timestamp=datetime.utcnow()
            )
            embed.set_footer(
                text=f"GlobalChat Broadcast von {ctx.author}", 
                icon_url=ctx.author.display_avatar.url
            )
            
            # An alle Channels senden
            successful, failed = await self.sender.send_global_broadcast_message(embed)

            # Response
            result_embed = discord.Embed(
                title="✅ Broadcast gesendet",
                color=discord.Color.green(),
                timestamp=datetime.utcnow()
            )
            result_embed.add_field(
                name="📊 Ergebnis",
                value=(
                    f"**Erfolgreich:** {successful}\n"
                    f"**Fehlgeschlagen:** {failed}\n"
                    f"**Gesamt:** {successful + failed}"
                ),
                inline=False
            )
            result_embed.add_field(
                name="📝 Nachricht", 
                value=f"**{title}**\n{message[:100]}{'...' if len(message) > 100 else ''}", 
                inline=False
            )
            await ctx.respond(embed=result_embed, ephemeral=True)
            logger.info(
                f"📢 Broadcast: '{title}' | Von: {ctx.author} | "
                f"✅ {successful} | ❌ {failed}"
            )
        except Exception as e:
            logger.error(f"❌ Broadcast-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Fehler beim Senden des Broadcasts!", ephemeral=True)

    @globalchat.command(
        name="reload-cache", 
        description="🧠 Lädt alle Cache-Daten neu (Admin)"
    )
    async def globalchat_reload_cache(self, ctx: discord.ApplicationContext):
        """Lädt den Channel-Cache neu (Bot Owner)"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            old_count = len(self.sender._cached_channels or [])
            self.sender._cached_channels = await self.sender._fetch_all_channels()
            new_count = len(self.sender._cached_channels)

            await ctx.respond(
                f"✅ **Cache neu geladen!**\n\n"
                f"Alte Channel-Anzahl: **{old_count}**\n"
                f"Neue Channel-Anzahl: **{new_count}**",
                ephemeral=True
            )
            logger.info(f"🧠 GlobalChat Cache manuell neu geladen. {old_count} -> {new_count}")

        except Exception as e:
            logger.error(f"❌ Cache Reload Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)


    @globalchat.command(
        name="debug", 
        description="🐛 Zeigt Debug-Informationen an (Admin)"
    )
    async def globalchat_debug(self, ctx: discord.ApplicationContext):
        """Zeigt Debug-Informationen (Bot Owner)"""
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            cached_channels = len(self.sender._cached_channels or [])
            all_settings = db.get_all_guild_settings()
            
            debug_info = (
                f"**Bot-Status:**\n"
                f"• Latency: `{round(self.bot.latency * 1000)}ms`\n"
                f"• Guilds: `{len(self.bot.guilds)}`\n"
                f"• Uptime: `<t:{int(self.bot.start_time.timestamp())}:R>`\n\n"
                f"**GlobalChat-Status:**\n"
                f"• Aktive Channels (Cache): `{cached_channels}`\n"
                f"• DB Settings Einträge: `{len(all_settings)}`\n"
                f"• Cleanup Task: `{'Aktiv' if self.cleanup_task.is_running() else 'Inaktiv'}`\n"
            )

            # Beispiel für Blacklist-Info
            user_bans, guild_bans = db.get_blacklist_stats()
            debug_info += (
                f"• Gebannte User/Server: `{user_bans} / {guild_bans}`"
            )

            embed = discord.Embed(
                title="🐛 GlobalChat Debug-Informationen",
                description=debug_info,
                color=discord.Color.orange(),
                timestamp=datetime.utcnow()
            )
            await ctx.respond(embed=embed, ephemeral=True)
        except Exception as e:
            logger.error(f"❌ Debug Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)


# ==================== Setup Funktion ====================
def setup(bot):
    """Setup-Funktion für the cog when loaded by classic..."""
    # Stelle sicher, dass die Datenbank initialisiert wird, falls nicht schon geschehen
    GlobalChatDatabase().create_tables()
    # Füge die Cog hinzu
    bot.add_cog(GlobalChat(bot))