# Copyright (c) 2026 OPPRO.NET Network
# MariaDB version of GlobalChatDatabase - FINAL COMPLETE FIX
import aiomysql
import logging
import asyncio
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from mxmariadb.connector import MariaConnector

# Setze das Logging auf Info, damit wir sehen, was passiert
logger = logging.getLogger(__name__)

class GlobalChatDatabase(MariaConnector):
    """MariaDB-backed GlobalChat database. Vollständige Version mit allen Funktionen."""

    def __init__(self):
        super().__init__()

    async def _ensure_pool(self):
        """Stellt sicher, dass die Verbindung steht."""
        if self.pool is None:
            await self.connect() # Versuch zu verbinden
            
        attempts = 0
        while self.pool is None and attempts < 15: # Etwas länger warten
            await asyncio.sleep(0.5)
            attempts += 1
            
        if self.pool is None:
            # Wenn wir hier landen, konnte connect() den Pool nicht erstellen
            logger.error("!!! DATABASE POOL COULD NOT BE INITIALIZED !!!")
            # Wir werfen keinen harten RuntimeError mehr, damit der Bot nicht stirbt
            return False
        return True

    async def init_db(self):
        """Create all required tables."""
        await self.create_tables()

    async def create_tables(self):
        try:
            # 1. Verbindung versuchen
            await self._ensure_pool()
            
            # 2. DER KRITISCHE CHECK: Wenn der Pool nicht existiert, abbrechen statt crashen!
            if self.pool is None:
                logger.error("!!! DATABASE POOL IS NONE - SKIPPING TABLE CREATION !!!")
                return # Hier beenden wir die Funktion sauber. Der Bot bleibt online!

            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    # Channels Table
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS globalchat_channels (
                            guild_id BIGINT PRIMARY KEY,
                            channel_id BIGINT NOT NULL,
                            guild_name VARCHAR(255),
                            channel_name VARCHAR(255),
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                            message_count BIGINT DEFAULT 0,
                            is_active TINYINT(1) DEFAULT 1
                        )
                    """)

                    # Message Log Table
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS message_log (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            user_id BIGINT NOT NULL,
                            guild_id BIGINT NOT NULL,
                            channel_id BIGINT NOT NULL,
                            content TEXT,
                            attachment_urls TEXT,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_user (user_id),
                            INDEX idx_guild_ts (guild_id, timestamp)
                        )
                    """)

                    # Blacklist Table
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS globalchat_blacklist (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            entity_type VARCHAR(10) NOT NULL,
                            entity_id BIGINT NOT NULL,
                            reason TEXT,
                            banned_by BIGINT,
                            banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            expires_at DATETIME,
                            is_permanent TINYINT(1) DEFAULT 0,
                            UNIQUE KEY uq_entity (entity_type, entity_id)
                        )
                    """)

                    # Guild Settings Table
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS guild_settings (
                            guild_id BIGINT PRIMARY KEY,
                            filter_enabled TINYINT(1) DEFAULT 1,
                            nsfw_filter TINYINT(1) DEFAULT 1,
                            embed_color VARCHAR(10) DEFAULT '#5865F2',
                            custom_webhook_name VARCHAR(255),
                            max_message_length INT DEFAULT 1900,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """)

                    # Daily Stats Table
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS daily_stats (
                            date DATE PRIMARY KEY,
                            total_messages BIGINT DEFAULT 0,
                            active_guilds INT DEFAULT 0,
                            active_users INT DEFAULT 0
                        )
                    """)
                await conn.commit()
            logger.info("MariaDB globalchat tables created/verified")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            # WICHTIG: Kein 'raise' hier, wenn der Bot trotz DB-Fehler starten soll!

    # ------------------------------------------------------------------
    # Channels
    # ------------------------------------------------------------------

    async def set_globalchat_channel(self, guild_id: int, channel_id: int, 
                                     guild_name: str = None, channel_name: str = None) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO globalchat_channels 
                        (guild_id, channel_id, guild_name, channel_name, last_activity)
                        VALUES (%s, %s, %s, %s, NOW())
                        ON DUPLICATE KEY UPDATE 
                            channel_id = VALUES(channel_id),
                            guild_name = VALUES(guild_name),
                            channel_name = VALUES(channel_name),
                            last_activity = NOW()
                    """, (guild_id, channel_id, guild_name, channel_name))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error setting GlobalChat channel: {e}")
            return False

    async def get_all_channels(self) -> List[int]:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT channel_id FROM globalchat_channels WHERE is_active = 1")
                    rows = await cur.fetchall()
                    return [r[0] for r in rows]
        except Exception as e:
            logger.error(f"Error retrieving all channels: {e}")
            return []

    async def get_globalchat_channel(self, guild_id: int) -> Optional[int]:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT channel_id FROM globalchat_channels WHERE guild_id = %s AND is_active = 1", (guild_id,))
                    result = await cur.fetchone()
                    return result[0] if result else None
        except Exception as e:
            logger.error(f"Error retrieving channel for guild {guild_id}: {e}")
            return None

    async def remove_globalchat_channel(self, guild_id: int) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM globalchat_channels WHERE guild_id = %s", (guild_id,))
                    changes = cur.rowcount
                await conn.commit()
            return changes > 0
        except Exception as e:
            logger.error(f"Error removing GlobalChat channel: {e}")
            return False

    async def update_channel_activity(self, guild_id: int):
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        UPDATE globalchat_channels 
                        SET last_activity = NOW(), message_count = message_count + 1 
                        WHERE guild_id = %s
                    """, (guild_id,))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error updating activity: {e}")

    # ------------------------------------------------------------------
    # Message Log
    # ------------------------------------------------------------------

    async def log_message(self, user_id: int, guild_id: int, channel_id: int, 
                           content: str, attachment_urls: str = None):
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO message_log (user_id, guild_id, channel_id, content, attachment_urls)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (user_id, guild_id, channel_id, content, attachment_urls))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error logging message: {e}")

    async def get_user_message_history(self, user_id: int, limit: int = 10) -> List[Dict]:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("""
                        SELECT * FROM message_log WHERE user_id = %s 
                        ORDER BY timestamp DESC LIMIT %s
                    """, (user_id, limit))
                    return await cur.fetchall()
        except Exception as e:
            logger.error(f"Error retrieving history: {e}")
            return []

    # ------------------------------------------------------------------
    # Blacklist
    # ------------------------------------------------------------------

    async def add_to_blacklist(self, entity_type: str, entity_id: int, reason: str, 
                               banned_by: int, duration_hours: int = None) -> bool:
        try:
            await self._ensure_pool()
            expires_at = datetime.now() + timedelta(hours=duration_hours) if duration_hours else None
            is_perm = 1 if duration_hours is None else 0
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO globalchat_blacklist 
                        (entity_type, entity_id, reason, banned_by, expires_at, is_permanent)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                            reason = VALUES(reason), 
                            banned_by = VALUES(banned_by),
                            expires_at = VALUES(expires_at), 
                            is_permanent = VALUES(is_permanent)
                    """, (entity_type, entity_id, reason, banned_by, expires_at, is_perm))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error adding to blacklist: {e}")
            return False

    async def remove_from_blacklist(self, entity_type: str, entity_id: int) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM globalchat_blacklist WHERE entity_type = %s AND entity_id = %s", (entity_type, entity_id))
                    changes = cur.rowcount
                await conn.commit()
            return changes > 0
        except Exception as e:
            logger.error(f"Error removing from blacklist: {e}")
            return False

    async def is_blacklisted(self, entity_type: str, entity_id: int) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT expires_at, is_permanent FROM globalchat_blacklist WHERE entity_type = %s AND entity_id = %s", (entity_type, entity_id))
                    res = await cur.fetchone()
                    if not res: return False
                    if res['is_permanent']: return True
                    if res['expires_at'] and datetime.now() > res['expires_at']:
                        await self.remove_from_blacklist(entity_type, entity_id)
                        return False
                    return True
        except Exception as e:
            logger.error(f"Error checking blacklist: {e}")
            return False

    async def get_blacklist(self, entity_type: str = None) -> List[Dict]:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    if entity_type:
                        await cur.execute("SELECT * FROM globalchat_blacklist WHERE entity_type = %s", (entity_type,))
                    else:
                        await cur.execute("SELECT * FROM globalchat_blacklist")
                    return await cur.fetchall()
        except Exception as e:
            logger.error(f"Error getting blacklist: {e}")
            return []

    # ------------------------------------------------------------------
    # Guild Settings
    # ------------------------------------------------------------------

    async def get_guild_settings(self, guild_id: int) -> Dict:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT * FROM guild_settings WHERE guild_id = %s", (guild_id,))
                    res = await cur.fetchone()
                    if res: return dict(res)
                    return {'guild_id': guild_id, 'filter_enabled': True, 'nsfw_filter': True, 'embed_color': '#5865F2'}
        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            return {}

    async def update_guild_setting(self, guild_id: int, setting_name: str, value) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(f"INSERT INTO guild_settings (guild_id, {setting_name}) VALUES (%s, %s) ON DUPLICATE KEY UPDATE {setting_name} = %s", (guild_id, value, value))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return False

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    async def get_global_stats(self) -> Dict:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT COUNT(*) AS cnt FROM globalchat_channels WHERE is_active = 1")
                    active_guilds = (await cur.fetchone())['cnt']
                    await cur.execute("SELECT total_messages FROM daily_stats WHERE date = CURDATE()")
                    today = await cur.fetchone()
                    today_msg = today['total_messages'] if today else 0
                    await cur.execute("SELECT COALESCE(SUM(message_count), 0) AS total FROM globalchat_channels")
                    total_msg = (await cur.fetchone())['total']
                    return {'active_guilds': active_guilds, 'total_messages': total_msg, 'today_messages': today_msg}
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}

    async def update_daily_stats(self):
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT COUNT(*) FROM globalchat_channels")
                    cnt = (await cur.fetchone())[0]
                    await cur.execute("""
                        INSERT INTO daily_stats (date, total_messages, active_guilds) 
                        VALUES (CURDATE(), 1, %s) 
                        ON DUPLICATE KEY UPDATE total_messages = total_messages + 1, active_guilds = %s
                    """, (cnt, cnt))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error updating daily stats: {e}")

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    async def cleanup_old_data(self, days: int = 30):
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM message_log WHERE timestamp < DATE_SUB(NOW(), INTERVAL %s DAY)", (days,))
                    await cur.execute("DELETE FROM globalchat_blacklist WHERE expires_at < NOW() AND is_permanent = 0")
                    await cur.execute("DELETE FROM daily_stats WHERE date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)")
                await conn.commit()
                logger.info(f"Cleanup completed for data older than {days} days")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM message_log WHERE user_id = %s", (user_id,))
                    await cur.execute("DELETE FROM globalchat_blacklist WHERE entity_type = 'user' AND entity_id = %s", (user_id,))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting user data: {e}")
            return False