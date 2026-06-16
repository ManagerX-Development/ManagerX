import discord
import asyncio
import io
import aiohttp
import logging
from typing import List, Tuple, Optional
from mxmariadb import GlobalChatDatabase
from ._config import GlobalChatConfig
from ._embeds import EmbedBuilder

logger = logging.getLogger(__name__)
db = GlobalChatDatabase()

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
        settings = await db.get_guild_settings(message.guild.id)
        embed, files_to_upload = await self.embed_builder.create_message_embed(message, settings, attachment_data)
        active_channels = await self._get_all_active_channels()
        successful_sends, failed_sends = 0, 0

        # Batching (split into groups of 10 to reduce lag)
        batch_size = 10
        for i in range(0, len(active_channels), batch_size):
            current_batch = active_channels[i:i + batch_size]
            task_list = [self._send_to_channel(channel_id, embed, files_to_upload) for channel_id in current_batch]
            results = await asyncio.gather(*task_list, return_exceptions=True)
            
            for result in results:
                if result is True:
                    successful_sends += 1
                else:
                    failed_sends += 1
            
            await asyncio.sleep(0.1) # Prevents hitting rate limits too hard

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
