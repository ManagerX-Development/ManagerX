# Copyright (c) 2025 OPPRO.NET Network
import discord
from discord.ext import commands, tasks
from discord import slash_command, Option, SlashCommandGroup
from mxmariadb import GlobalChatDatabase
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
db = GlobalChatDatabase()
logger = logging.getLogger(__name__)


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


class MessageValidator:
    def __init__(self, config: GlobalChatConfig):
        self.config = config
        self.media_handler = MediaHandler(config)
        self._compile_patterns()

    def _compile_patterns(self):
        self.invite_pattern = re.compile(self.config.DISCORD_INVITE_PATTERN)
        self.url_pattern = re.compile(self.config.URL_PATTERN)

    # ✅ Umgewandelt zu async – is_blacklisted ist async in der DB
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


class EmbedBuilder:
    def __init__(self, config: GlobalChatConfig, bot=None):
        self.config = config
        self.media_handler = MediaHandler(config)
        self.bot = bot

    async def create_message_embed(self, message: discord.Message, settings: Dict, attachment_data: List[Tuple[str, bytes, str]] = None) -> Tuple[discord.Embed, List[Tuple[str, bytes]]]:
        if attachment_data is None:
            attachment_data = []

        content = self._clean_content(message.content)
        embed_color = self._parse_color(settings.get('embed_color', self.config.DEFAULT_EMBED_COLOR))

        if content:
            description = f"{content}"
        elif message.attachments or message.stickers or attachment_data:
            description = "📎 *Medien-Nachricht*"
        else:
            description = ""

        embed = discord.Embed(description=description, color=embed_color, timestamp=message.created_at)
        author_text, badges = self._build_author_info(message.author)

        from mx_devtools import EconomyDatabase
        eco_db = EconomyDatabase()
        overrides = eco_db.get_equipped_overrides(message.author.id)
        if 'color' in overrides:
            embed_color = self._parse_color(overrides['color'])
            embed.color = embed_color
        if 'emoji' in overrides:
            author_text = f"{overrides['emoji']} {author_text}"

        embed.set_author(name=author_text, icon_url=message.author.display_avatar.url)
        embed.set_thumbnail(url=message.author.display_avatar.url)
        footer_text = f"🌐 {message.guild.name}  •  #{message.channel.name}  •  ID:{message.id}"
        embed.set_footer(text=footer_text, icon_url=message.guild.icon.url if message.guild.icon else None)

        if message.reference:
            try:
                replied_msg = message.reference.resolved
                if not replied_msg and getattr(message.reference, 'message_id', None):
                    ref_channel = None
                    ref_chan_id = getattr(message.reference, 'channel_id', None)
                    if ref_chan_id:
                        ref_channel = self.bot.get_channel(ref_chan_id)
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

                if isinstance(replied_msg, discord.Message):
                    preview = replied_msg.content or ""
                    if not preview and replied_msg.embeds:
                        try:
                            preview = replied_msg.embeds[0].description or ""
                        except Exception:
                            preview = ""
                    if not preview:
                        if replied_msg.attachments:
                            preview = f"📎 {len(replied_msg.attachments)} Datei(en)"
                        elif replied_msg.stickers:
                            preview = "🎨 Sticker"
                        else:
                            preview = "*(Leere Nachricht)*"

                    preview = self._clean_content(preview)
                    preview_short = (preview[:200] + "...") if len(preview) > 200 else preview

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
                pass

        files_to_upload = await self._process_media(embed, message, attachment_data)
        return embed, files_to_upload

    async def _process_media(self, embed: discord.Embed, message: discord.Message, attachment_data: List[Tuple[str, bytes, str]] = None) -> List[Tuple[str, bytes]]:
        if attachment_data is None:
            attachment_data = []
        attachment_bytes: List[Tuple[str, bytes]] = []
        if attachment_data:
            attachment_bytes.extend(self._process_downloaded_attachments(embed, attachment_data))
        if message.stickers:
            self._process_stickers(embed, message.stickers)
        if message.embeds:
            self._process_embeds(embed, message.embeds)
        return attachment_bytes

    def _process_downloaded_attachments(self, embed: discord.Embed, attachment_data: List[Tuple[str, bytes, str]]) -> List[Tuple[str, bytes]]:
        attachment_bytes: List[Tuple[str, bytes]] = []
        images, videos, audios, documents, others = [], [], [], [], []

        for filename, data, content_type in attachment_data:
            category = self._get_attachment_category(filename, content_type)
            if category == 'image':
                images.append((filename, data))
            elif category == 'video':
                videos.append((filename, data))
            elif category == 'audio':
                audios.append((filename, data))
            elif category == 'document':
                documents.append((filename, data))
            else:
                others.append((filename, data))

        if images:
            embed.set_image(url=f"attachment://{images[0][0]}")
            for filename, data in images:
                attachment_bytes.append((filename, data))
            if len(images) > 1:
                embed.add_field(name="🖼️ Weitere Bilder", value=f"_{len(images)-1} zusätzliche Bilder angehängt._", inline=False)

        if videos:
            video_links = []
            for video_name, video_data in videos:
                video_links.append(f"🎥 {video_name} ({self.media_handler.format_file_size(len(video_data))})")
                attachment_bytes.append((video_name, video_data))
            embed.add_field(name="🎬 Videos", value="\n".join(video_links[:3]), inline=False)

        if audios:
            audio_links = []
            for audio_name, audio_data in audios:
                audio_links.append(f"🎵 {audio_name} ({self.media_handler.format_file_size(len(audio_data))})")
                attachment_bytes.append((audio_name, audio_data))
            embed.add_field(name="🎧 Audio-Dateien", value="\n".join(audio_links[:3]), inline=False)

        if documents:
            doc_links = []
            for doc_name, doc_data in documents:
                doc_links.append(f"📄 {doc_name} ({self.media_handler.format_file_size(len(doc_data))})")
                attachment_bytes.append((doc_name, doc_data))
            embed.add_field(name="📄 Dokumente", value="\n".join(doc_links[:3]), inline=False)

        if others:
            other_links = []
            for other_name, other_data in others:
                other_links.append(f"📎 {other_name} ({self.media_handler.format_file_size(len(other_data))})")
                attachment_bytes.append((other_name, other_data))
            embed.add_field(name="📎 Sonstige", value="\n".join(other_links[:3]), inline=False)

        return attachment_bytes

    def _process_stickers(self, embed: discord.Embed, stickers: List[discord.StickerItem]):
        if not stickers:
            return
        sticker_info = []
        for sticker in stickers:
            sticker_type = "Standard" if sticker.url.endswith('.png') else "Animiert"
            sticker_info.append(f"🎨 **{sticker.name}** ({sticker_type})")
        embed.add_field(name="🎨 Sticker", value="\n".join(sticker_info[:3]), inline=False)
        if stickers[0].format.name in ['PNG', 'LOTTIE']:
            embed.set_thumbnail(url=stickers[0].url)

    def _process_embeds(self, main_embed: discord.Embed, embeds: List[discord.Embed]):
        if not embeds:
            return
        link_embeds = []
        for embed in embeds:
            if embed.type not in ['image', 'video', 'gifv'] and (embed.title or embed.description or embed.url):
                title = embed.title or "Unbekannter Link"
                description = (embed.description[:100] + "...") if embed.description else ""
                url = embed.url or ""
                link_embeds.append(f"**[{title}]({url})**\n_{description}_")
        if link_embeds:
            main_embed.add_field(name="🔗 Verlinkte Inhalte", value="\n\n".join(link_embeds), inline=False)

    def _get_attachment_category(self, filename: str, content_type: str) -> str:
        if content_type.startswith('image/'):
            return 'image'
        elif content_type.startswith('video/'):
            return 'video'
        elif content_type.startswith('audio/'):
            return 'audio'
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
        return 'other'

    def _clean_content(self, content: str) -> str:
        if not content:
            return ""
        content = content.replace('@everyone', '＠everyone').replace('@here', '＠here')
        content = re.sub(r'<@&(\d+)>', r'＠role', content)
        return content.strip()

    def _parse_color(self, color_hex: str) -> discord.Color:
        try:
            return discord.Color(int(color_hex.lstrip('#'), 16))
        except (ValueError, TypeError):
            return discord.Color.blurple()

    def _build_author_info(self, author: discord.Member) -> Tuple[str, List[str]]:
        badges, roles = [], []
        if author.id in self.config.BOT_OWNERS:
            badges.append("👑")
            roles.append("Bot Owner")
        if author.guild_permissions.administrator:
            badges.append("⚡")
            roles.append("Admin")
        elif author.guild_permissions.manage_guild:
            badges.append("🔧")
            roles.append("Mod")
        if hasattr(author, 'premium_since') and author.premium_since:
            badges.append("💎")
            roles.append("Booster")
        badge_text = " ".join(badges)
        display = author.display_name
        author_text = f"{badge_text}  {display}  (@{author.name})" if badge_text else f"{display}  (@{author.name})"
        if author.bot:
            author_text += " ✦ BOT"
        return author_text, roles


class GlobalChatSender:
    def __init__(self, bot, config: GlobalChatConfig, embed_builder: EmbedBuilder):
        self.bot = bot
        self.config = config
        self.embed_builder = embed_builder
        self._cached_channels: Optional[List[int]] = None

    async def _get_all_active_channels(self) -> List[int]:
        if self._cached_channels is None:
            self._cached_channels = await self._fetch_all_channels()
        return self._cached_channels

    async def _fetch_all_channels(self) -> List[int]:
        try:
            # ✅ await hinzugefügt
            return await db.get_all_channels()
        except Exception as e:
            logger.error(f"❌ Fehler beim Abrufen aller Channel-IDs: {e}", exc_info=True)
            return []

    async def _send_to_channel(self, channel_id: int, embed: discord.Embed, attachment_bytes: List[Tuple[str, bytes]]) -> bool:
        try:
            channel = self.bot.get_channel(channel_id)
            if not channel:
                try:
                    channel = await self.bot.fetch_channel(channel_id)
                except Exception:
                    logger.warning(f"⚠️ Channel {channel_id} konnte nicht abgerufen werden.")
                    return False

            if hasattr(channel, 'guild') and channel.guild:
                perms = channel.permissions_for(channel.guild.me)
                if not perms.send_messages or not perms.embed_links:
                    logger.warning(f"⚠️ Keine Permissions in {channel_id} ({channel.guild.name})")
                    return False

            files = []
            if attachment_bytes:
                for filename, data in attachment_bytes:
                    try:
                        files.append(discord.File(io.BytesIO(data), filename=filename))
                    except Exception as e:
                        logger.warning(f"⚠️ Error creating file {filename}: {e}")

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
                    logger.warning(f"❌ Bot hat Senderechte in {channel_id} verloren.")
                    if self._cached_channels and channel_id in self._cached_channels:
                        self._cached_channels.remove(channel_id)
                    return False
                except Exception as e:
                    logger.error(f"❌ Unerwarteter Sendefehler in {channel_id}: {e}")
                    return False

            logger.error(f"❌ Senden nach {max_retries} Retries in {channel_id} fehlgeschlagen.")
            return False
        except Exception as e:
            logger.error(f"❌ Generischer Fehler im _send_to_channel: {e}", exc_info=True)
            return False

    async def send_global_message(self, message: discord.Message, attachment_data: List[Tuple[str, bytes, str]] = None) -> Tuple[int, int]:
        # ✅ await hinzugefügt
        settings = await db.get_guild_settings(message.guild.id)
        embed, files_to_upload = await self.embed_builder.create_message_embed(message, settings, attachment_data)
        active_channels = await self._get_all_active_channels()
        successful_sends, failed_sends = 0, 0

        task_list = [self._send_to_channel(channel_id, embed, files_to_upload) for channel_id in active_channels]
        results = await asyncio.gather(*task_list, return_exceptions=True)

        for result in results:
            if result is True:
                successful_sends += 1
            else:
                failed_sends += 1
                if isinstance(result, Exception):
                    logger.error(f"❌ Task-Fehler beim Senden: {result}")

        return successful_sends, failed_sends

    async def send_global_broadcast_message(self, embed: discord.Embed) -> Tuple[int, int]:
        active_channels = await self._get_all_active_channels()
        successful_sends, failed_sends = 0, 0
        task_list = [self._send_to_channel(channel_id, embed, []) for channel_id in active_channels]
        results = await asyncio.gather(*task_list, return_exceptions=True)
        for result in results:
            if result is True:
                successful_sends += 1
            else:
                failed_sends += 1
        return successful_sends, failed_sends


class GlobalChat(ezcord.Cog):
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
        self._cached_channels = None
        self.sender = GlobalChatSender(self.bot, self.config, self.embed_builder)
        self.cleanup_task.start()
        self.bot.loop.create_task(GlobalChatDatabase().create_tables())

    @tasks.loop(hours=12)
    async def cleanup_task(self):
        await self.sender._get_all_active_channels()
        logger.info("🧠 GlobalChat: Channel-Cache neu geladen.")

    @ezcord.Cog.listener()
    async def on_message(self, message: discord.Message):
        if not message.guild or message.author.bot:
            return

        # ✅ await war bereits vorhanden
        global_chat_channel_id = await db.get_globalchat_channel(message.guild.id)
        if message.channel.id != global_chat_channel_id:
            return

        # ✅ await hinzugefügt
        settings = await db.get_guild_settings(message.guild.id)

        # ✅ validate_message ist jetzt async
        is_valid, reason = await self.validator.validate_message(message, settings)
        if not is_valid:
            logger.debug(f"❌ Nachricht abgelehnt: {reason} (User: {message.author.id})")
            if any(keyword in reason for keyword in ["Blacklist", "NSFW", "Gefilterte", "Ungültige Anhänge", "zu groß"]):
                try:
                    await message.add_reaction("❌")
                    if "Ungültige Anhänge" in reason or "zu groß" in reason:
                        await message.reply(
                            f"❌ **Fehler:** {reason}\n"
                            f"**Max. Größe:** {self.config.MAX_FILE_SIZE_MB}MB pro Datei\n"
                            f"**Max. Anhänge:** {self.config.MAX_ATTACHMENTS}",
                            delete_after=7
                        )
                    await asyncio.sleep(2)
                    await message.delete()
                except (discord.Forbidden, discord.NotFound):
                    pass
            return

        from mx_devtools import EconomyDatabase
        eco_db = EconomyDatabase()
        user_info = eco_db.get_user_economy_info(message.author.id)
        last_msg_raw = user_info.get('last_message_at')
        can_earn = True
        if last_msg_raw:
            try:
                try:
                    last_dt = datetime.strptime(last_msg_raw, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    last_dt = datetime.fromisoformat(last_msg_raw)
                if datetime.utcnow() < last_dt + timedelta(seconds=30):
                    can_earn = False
            except Exception:
                pass
        if can_earn:
            eco_db.add_global_coins(message.author.id, random.randint(5, 15))
            eco_db.update_last_message(message.author.id)

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

        attachment_data: List[Tuple[str, bytes, str]] = []
        if message.attachments:
            try:
                await message.channel.trigger_typing()
                for attachment in message.attachments:
                    if attachment.size <= self.config.MAX_FILE_SIZE_MB * 1024 * 1024:
                        data = await attachment.read()
                        attachment_data.append((attachment.filename, data, attachment.content_type))
            except Exception as e:
                logger.error(f"❌ Fehler beim Herunterladen von Attachments: {e}")
                attachment_data = []

        try:
            await message.delete()
        except discord.Forbidden:
            logger.warning(f"⚠️ Keine Permissions zum Löschen der Original-Nachricht in {message.channel.id}")
        except discord.NotFound:
            pass

        successful, failed = await self.sender.send_global_message(message, attachment_data)
        logger.info(f"🌍 GlobalChat: Nachricht von {message.guild.name} | User: {message.author.name} | ✅ {successful} | ❌ {failed}")

    # ==================== Slash Commands ====================

    @globalchat.command(name="setup", description="Richtet einen GlobalChat-Channel ein")
    async def setup_globalchat(
        self,
        ctx: discord.ApplicationContext,
        channel: discord.TextChannel = Option(discord.TextChannel, "Der GlobalChat-Channel", required=True)
    ):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        bot_perms = channel.permissions_for(ctx.guild.me)
        missing_perms = []
        if not bot_perms.send_messages: missing_perms.append("Nachrichten senden")
        if not bot_perms.manage_messages: missing_perms.append("Nachrichten verwalten")
        if not bot_perms.embed_links: missing_perms.append("Links einbetten")
        if not bot_perms.read_message_history: missing_perms.append("Nachrichten-Historie lesen")
        if not bot_perms.attach_files: missing_perms.append("Dateien anhängen")

        if missing_perms:
            await ctx.respond(
                f"❌ Mir fehlen wichtige Berechtigungen in {channel.mention}:\n" +
                "\n".join([f"• {p}" for p in missing_perms]),
                ephemeral=True
            )
            return

        try:
            # ✅ await hinzugefügt
            await db.set_globalchat_channel(ctx.guild.id, channel.id)
            self.sender._cached_channels = await self.sender._fetch_all_channels()

            container = Container()
            status_text = (
                f"✅ **GlobalChat eingerichtet!**\n\n"
                f"Der GlobalChat ist nun in {channel.mention} aktiv.\n"
                f"Aktuell verbunden: **{len(self.sender._cached_channels)}** Server."
            )
            container.add_text(status_text)
            container.add_separator()
            container.add_text(
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
            view = discord.ui.DesignerView(container, timeout=None)
            await ctx.respond(view=view, ephemeral=True)
        except Exception as e:
            logger.error(f"❌ Setup-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(name="remove", description="Entfernt den GlobalChat-Channel")
    async def remove_globalchat(self, ctx: discord.ApplicationContext):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        channel_id = await db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        try:
            # ✅ await hinzugefügt
            await db.set_globalchat_channel(ctx.guild.id, None)
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

    @globalchat.command(name="settings", description="Verwaltet Server-spezifische GlobalChat-Einstellungen")
    async def settings_globalchat(
        self,
        ctx: discord.ApplicationContext,
        filter_enabled: Optional[bool] = Option(bool, "Content-Filter aktivieren/deaktivieren", required=False),
        nsfw_filter: Optional[bool] = Option(bool, "NSFW-Filter aktivieren/deaktivieren", required=False),
        embed_color: Optional[str] = Option(str, "Hex-Farbcode für Embeds (z.B. #FF00FF)", required=False),
        max_message_length: Optional[int] = Option(int, "Maximale Nachrichtenlänge", required=False, min_value=50, max_value=2000)
    ):
        if not ctx.author.guild_permissions.manage_guild:
            await ctx.respond("❌ Du benötigst die **Server verwalten** Berechtigung!", ephemeral=True)
            return

        if not await db.get_globalchat_channel(ctx.guild.id):
            await ctx.respond("❌ Dieser Server nutzt GlobalChat nicht!\nNutze `/globalchat setup` zuerst.", ephemeral=True)
            return

        updated = []
        # ✅ await hinzugefügt für alle update_guild_setting Aufrufe
        if filter_enabled is not None:
            if await db.update_guild_setting(ctx.guild.id, 'filter_enabled', filter_enabled):
                updated.append(f"Content-Filter: {'✅ An' if filter_enabled else '❌ Aus'}")

        if nsfw_filter is not None:
            if await db.update_guild_setting(ctx.guild.id, 'nsfw_filter', nsfw_filter):
                updated.append(f"NSFW-Filter: {'✅ An' if nsfw_filter else '❌ Aus'}")

        if embed_color:
            if not re.match(r'^#[0-9a-fA-F]{6}$', embed_color):
                await ctx.respond("❌ Ungültiger Hex-Farbcode. Erwarte z.B. `#5865F2`.", ephemeral=True)
                return
            if await db.update_guild_setting(ctx.guild.id, 'embed_color', embed_color):
                updated.append(f"Embed-Farbe: `{embed_color}`")

        if max_message_length is not None:
            if await db.update_guild_setting(ctx.guild.id, 'max_message_length', max_message_length):
                updated.append(f"Max. Länge: **{max_message_length}** Zeichen")

        if not updated:
            await ctx.respond("ℹ️ Keine Änderungen vorgenommen.", ephemeral=True)
            return

        embed = discord.Embed(
            title="✅ GlobalChat Einstellungen aktualisiert",
            description="\n".join(updated),
            color=discord.Color.green()
        )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="ban", description="🔨 Bannt einen User oder Server vom GlobalChat")
    async def globalchat_ban(
        self,
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers (Guild-ID)", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True),
        reason: str = Option(str, "Grund für den Ban", required=True),
        duration: Optional[int] = Option(int, "Dauer in Stunden (optional, permanent wenn leer)", required=False)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return

        try:
            # ✅ await hinzugefügt
            success = await db.add_to_blacklist(entity_type, entity_id_int, reason, ctx.author.id, duration)
            if not success:
                await ctx.respond("❌ Fehler beim Bannen!", ephemeral=True)
                return

            duration_text = f"{duration} Stunden" if duration else "Permanent"
            embed = discord.Embed(title="🔨 GlobalChat-Ban verhängt", color=discord.Color.red(), timestamp=datetime.utcnow())
            embed.add_field(name="Typ", value=entity_type.title(), inline=True)
            embed.add_field(name="ID", value=f"`{entity_id_int}`", inline=True)
            embed.add_field(name="Dauer", value=duration_text, inline=True)
            embed.add_field(name="Grund", value=reason, inline=False)
            embed.add_field(name="Von", value=ctx.author.mention, inline=True)
            if duration:
                expires = datetime.utcnow() + timedelta(hours=duration)
                embed.add_field(name="Läuft ab", value=f"<t:{int(expires.timestamp())}:R>", inline=True)
            await ctx.respond(embed=embed)
            logger.info(f"🔨 Ban: {entity_type} {entity_id_int} | Grund: {reason} | Dauer: {duration_text} | Von: {ctx.author.id}")
        except Exception as e:
            logger.error(f"❌ Ban-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten beim Bannen!", ephemeral=True)

    @globalchat.command(name="unban", description="🔓 Entfernt einen User oder Server von der GlobalChat-Blacklist")
    async def globalchat_unban(
        self,
        ctx: discord.ApplicationContext,
        entity_id: str = Option(str, "ID des Users oder Servers", required=True),
        entity_type: str = Option(str, "Typ der Entität", choices=["user", "guild"], required=True)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        try:
            entity_id_int = int(entity_id)
        except ValueError:
            await ctx.respond("❌ Ungültige ID. Erwarte eine Zahl.", ephemeral=True)
            return

        try:
            # ✅ await hinzugefügt
            if not await db.is_blacklisted(entity_type, entity_id_int):
                await ctx.respond(f"ℹ️ {entity_type.title()} `{entity_id_int}` ist nicht auf der Blacklist.", ephemeral=True)
                return

            if await db.remove_from_blacklist(entity_type, entity_id_int):
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

    @globalchat.command(name="info", description="Zeigt Informationen über den GlobalChat")
    async def globalchat_info(self, ctx: discord.ApplicationContext):
        active_servers = await self.sender._get_all_active_channels()
        # ✅ await hinzugefügt, einmal laden statt 3x
        guild_settings = await db.get_guild_settings(ctx.guild.id)

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
            value="• 🖼️ Bilder\n• 🎥 Videos\n• 🎵 Audio\n• 📄 Dokumente (PDF, Office, Archive)",
            inline=True
        )
        embed.add_field(
            name="🛡️ Moderation",
            value=(
                f"• **Content-Filter:** {'✅ An' if guild_settings.get('filter_enabled', True) else '❌ Aus'}\n"
                f"• **NSFW-Filter:** {'✅ An' if guild_settings.get('nsfw_filter', True) else '❌ Aus'}\n"
                f"• **Nachrichtenlänge:** {guild_settings.get('max_message_length', self.config.DEFAULT_MAX_MESSAGE_LENGTH)} Zeichen"
            ),
            inline=True
        )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="stats", description="Zeigt GlobalChat-Statistiken")
    async def globalchat_stats(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        # ✅ await hinzugefügt
        user_bans, guild_bans = await db.get_blacklist_stats()
        active_servers = await self.sender._get_all_active_channels()

        embed = discord.Embed(title="📊 GlobalChat System-Statistiken", color=discord.Color.gold(), timestamp=datetime.utcnow())
        embed.add_field(name="🌍 Verbundene Server", value=f"**{len(active_servers)}**", inline=True)
        embed.add_field(name="👥 Gebannte User", value=f"**{user_bans}**", inline=True)
        embed.add_field(name="🛡️ Gebannte Server", value=f"**{guild_bans}**", inline=True)
        embed.add_field(name="⏳ Cache-Dauer", value=f"{self.config.CACHE_DURATION} Sekunden", inline=True)
        embed.add_field(name="📜 Protokoll Bereinigung", value=f"Alle {self.config.CLEANUP_DAYS} Tage", inline=True)
        embed.add_field(name="⏰ Rate-Limit", value=f"{self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden", inline=True)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="media-info", description="Zeigt Details zu Medien-Limits und erlaubten Formaten")
    async def globalchat_media_info(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title="📁 GlobalChat Medien-Limits & Formate",
            description="Details zu den maximal erlaubten Dateigrößen und unterstützten Formaten.",
            color=discord.Color.purple(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="⚠️ Wichtige Limits",
            value=(
                f"• **Max. {self.config.MAX_ATTACHMENTS} Anhänge** pro Nachricht\n"
                f"• **Max. {self.config.MAX_FILE_SIZE_MB} MB** pro Datei\n"
                f"• **Max. {self.config.DEFAULT_MAX_MESSAGE_LENGTH} Zeichen** Textlänge\n"
                f"• **Rate-Limit:** {self.config.RATE_LIMIT_MESSAGES} Nachrichten pro {self.config.RATE_LIMIT_SECONDS} Sekunden"
            ),
            inline=False
        )
        embed.add_field(name="🖼️ Bilder", value=", ".join(self.config.ALLOWED_IMAGE_FORMATS).upper(), inline=True)
        embed.add_field(name="🎥 Videos", value=", ".join(self.config.ALLOWED_VIDEO_FORMATS).upper(), inline=True)
        embed.add_field(name="🎵 Audio", value=", ".join(self.config.ALLOWED_AUDIO_FORMATS).upper(), inline=True)
        embed.add_field(name="📄 Dokumente/Archive", value=", ".join(self.config.ALLOWED_DOCUMENT_FORMATS).upper(), inline=False)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="help", description="Zeigt die Hilfe-Seite für GlobalChat")
    async def globalchat_help(self, ctx: discord.ApplicationContext):
        embed = discord.Embed(
            title="❓ GlobalChat Hilfe & Übersicht",
            description="Übersicht aller verfügbaren Commands und Features.",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="⚙️ Setup & Verwaltung",
            value="`/globalchat setup` - Channel einrichten\n`/globalchat remove` - Channel entfernen\n`/globalchat settings` - Einstellungen anpassen",
            inline=False
        )
        embed.add_field(
            name="📊 Informationen",
            value="`/globalchat info` - Allgemeine Infos\n`/globalchat stats` - Statistiken anzeigen\n`/globalchat media-info` - Medien-Details\n`/globalchat help` - Diese Hilfe",
            inline=False
        )
        if ctx.author.id in self.config.BOT_OWNERS:
            embed.add_field(
                name="🛡️ Moderation (Bot Owner)",
                value="`/globalchat ban` - User/Server bannen\n`/globalchat unban` - User/Server entbannen",
                inline=False
            )
            embed.add_field(
                name="🧪 Test & Debug (Bot Owner)",
                value="`/globalchat test-media` - Medien-Test\n`/globalchat broadcast` - Nachricht an alle senden\n`/globalchat reload-cache` - Cache neu laden\n`/globalchat debug` - Debug-Info",
                inline=False
            )
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="test-media", description="🧪 Test-Command für Medien-Upload und -Anzeige")
    async def globalchat_test_media(self, ctx: discord.ApplicationContext):
        channel_id = await db.get_globalchat_channel(ctx.guild.id)
        if not channel_id:
            await ctx.respond("❌ GlobalChat ist auf diesem Server nicht eingerichtet.", ephemeral=True)
            return

        embed = discord.Embed(
            title="🧪 GlobalChat Medien-Test",
            description=(
                "Dieser Test zeigt dir, welche Medien-Typen erfolgreich übermittelt werden können.\n\n"
                "**Unterstützte Medien:**\n• Bilder, Videos, Audio, Dokumente\n• Discord Sticker\n• Antworten auf andere Nachrichten\n\n"
                "**So testest du:**\n"
                f"1. Gehe zu <#{channel_id}> und sende eine Nachricht mit Anhängen.\n"
                "2. Die Nachricht erscheint auf allen verbundenen Servern.\n\n"
                "Probiere verschiedene Kombinationen aus!"
            ),
            color=discord.Color.green(),
            timestamp=datetime.utcnow()
        )
        embed.add_field(
            name="📊 Aktuelle Limits",
            value=f"• Max. {self.config.MAX_ATTACHMENTS} Anhänge\n• Max. {self.config.MAX_FILE_SIZE_MB} MB pro Datei\n• {self.config.RATE_LIMIT_MESSAGES} Nachrichten / {self.config.RATE_LIMIT_SECONDS} Sekunden",
            inline=True
        )
        embed.add_field(name="✅ Unterstützte Formate", value="Bilder, Videos, Audio,\nDokumente, Archive,\nOffice-Dateien, PDFs", inline=True)
        embed.set_footer(text=f"Test von {ctx.author}", icon_url=ctx.author.display_avatar.url)
        await ctx.respond(embed=embed, ephemeral=True)

    @globalchat.command(name="broadcast", description="📢 Sendet eine Nachricht an alle verbundenen GlobalChat-Server")
    async def globalchat_broadcast(
        self,
        ctx: discord.ApplicationContext,
        title: str = Option(str, "Der Titel der Broadcast-Nachricht", required=True),
        message: str = Option(str, "Die Nachricht selbst", required=True)
    ):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            embed = discord.Embed(
                title=f"📢 GlobalChat Broadcast: {title}",
                description=message,
                color=discord.Color.red(),
                timestamp=datetime.utcnow()
            )
            embed.set_footer(text=f"GlobalChat Broadcast von {ctx.author}", icon_url=ctx.author.display_avatar.url)

            successful, failed = await self.sender.send_global_broadcast_message(embed)

            result_embed = discord.Embed(title="✅ Broadcast gesendet", color=discord.Color.green(), timestamp=datetime.utcnow())
            result_embed.add_field(
                name="📊 Ergebnis",
                value=f"**Erfolgreich:** {successful}\n**Fehlgeschlagen:** {failed}\n**Gesamt:** {successful + failed}",
                inline=False
            )
            result_embed.add_field(
                name="📝 Nachricht",
                value=f"**{title}**\n{message[:100]}{'...' if len(message) > 100 else ''}",
                inline=False
            )
            await ctx.respond(embed=result_embed, ephemeral=True)
            logger.info(f"📢 Broadcast: '{title}' | Von: {ctx.author} | ✅ {successful} | ❌ {failed}")
        except Exception as e:
            logger.error(f"❌ Broadcast-Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Fehler beim Senden des Broadcasts!", ephemeral=True)

    @globalchat.command(name="reload-cache", description="🧠 Lädt alle Cache-Daten neu (Admin)")
    async def globalchat_reload_cache(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            old_count = len(self.sender._cached_channels or [])
            self.sender._cached_channels = await self.sender._fetch_all_channels()
            new_count = len(self.sender._cached_channels)
            await ctx.respond(
                f"✅ **Cache neu geladen!**\n\nAlte Channel-Anzahl: **{old_count}**\nNeue Channel-Anzahl: **{new_count}**",
                ephemeral=True
            )
            logger.info(f"🧠 GlobalChat Cache manuell neu geladen. {old_count} -> {new_count}")
        except Exception as e:
            logger.error(f"❌ Cache Reload Fehler: {e}", exc_info=True)
            await ctx.respond("❌ Ein Fehler ist aufgetreten!", ephemeral=True)

    @globalchat.command(name="debug", description="🐛 Zeigt Debug-Informationen an (Admin)")
    async def globalchat_debug(self, ctx: discord.ApplicationContext):
        if ctx.author.id not in self.config.BOT_OWNERS:
            await ctx.respond("❌ Nur Bot-Owner können diesen Befehl nutzen.", ephemeral=True)
            return

        await ctx.defer(ephemeral=True)
        try:
            cached_channels = len(self.sender._cached_channels or [])
            # ✅ await hinzugefügt
            all_settings = await db.get_all_guild_settings()
            user_bans, guild_bans = await db.get_blacklist_stats()

            debug_info = (
                f"**Bot-Status:**\n"
                f"• Latency: `{round(self.bot.latency * 1000)}ms`\n"
                f"• Guilds: `{len(self.bot.guilds)}`\n"
                f"• Uptime: `<t:{int(self.bot.start_time.timestamp())}:R>`\n\n"
                f"**GlobalChat-Status:**\n"
                f"• Aktive Channels (Cache): `{cached_channels}`\n"
                f"• DB Settings Einträge: `{len(all_settings)}`\n"
                f"• Cleanup Task: `{'Aktiv' if self.cleanup_task.is_running() else 'Inaktiv'}`\n"
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


def setup(bot):
    bot.add_cog(GlobalChat(bot))