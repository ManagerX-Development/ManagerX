import discord
import re
from typing import Dict, List, Tuple
from ._config import GlobalChatConfig
from ._media import MediaHandler

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

        from mxmariadb import EconomyDatabase
        eco_db = EconomyDatabase()
        overrides = await eco_db.get_equipped_overrides(message.author.id)
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

                    reply_text = f"> **{author_display}**\n> {preview_short.replace(chr(10), chr(10)+'> ')}"
                    if origin:
                        reply_field_title = f"↩️ Antwort ({origin})"
                    else:
                        reply_field_title = "↩️ Antwort"
                    embed.add_field(name=reply_field_title, value=reply_text, inline=False)
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
