# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of SpamDB
import aiomysql
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from mxmariadb.connector import MariaConnector

class SpamDBError(Exception):
    """Custom exception for SpamDB errors"""
    pass


class SpamDB(MariaConnector):
    """MariaDB-backed spam database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()
        self.logger = logging.getLogger(__name__)

    async def init_db(self):
        """Create all necessary tables."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS spam_settings (
                        guild_id BIGINT PRIMARY KEY,
                        max_messages INT DEFAULT 5,
                        time_frame INT DEFAULT 10,
                        log_channel_id BIGINT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS spam_logs (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        message TEXT NOT NULL,
                        message_count INT DEFAULT 1,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_spam_logs_guild_ts (guild_id, timestamp),
                        INDEX idx_spam_logs_user_ts (user_id, timestamp)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS spam_whitelist (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        added_by BIGINT,
                        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        reason TEXT,
                        UNIQUE KEY uq_guild_user (guild_id, user_id)
                    )
                ''')
            await conn.commit()
        self.logger.info("MariaDB spam tables initialized")

    # ------------------------------------------------------------------
    # Settings
    # ------------------------------------------------------------------

    async def set_spam_settings(self, guild_id: int, max_messages: int = 5,
                                time_frame: int = 10, log_channel_id: Optional[int] = None) -> bool:
        await self.ensure_connection()
        if max_messages <= 0 or time_frame <= 0:
            raise SpamDBError("max_messages and time_frame must be positive integers")

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO spam_settings (guild_id, max_messages, time_frame, log_channel_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        max_messages = VALUES(max_messages),
                        time_frame = VALUES(time_frame),
                        log_channel_id = VALUES(log_channel_id)
                ''', (guild_id, max_messages, time_frame, log_channel_id))
            await conn.commit()
        return True

    async def set_log_channel(self, guild_id: int, channel_id: int) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT max_messages, time_frame FROM spam_settings WHERE guild_id = %s',
                    (guild_id,))
                result = await cur.fetchone()

                max_messages = result['max_messages'] if result else 5
                time_frame = result['time_frame'] if result else 10

                await cur.execute('''
                    INSERT INTO spam_settings (guild_id, max_messages, time_frame, log_channel_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        log_channel_id = VALUES(log_channel_id)
                ''', (guild_id, max_messages, time_frame, channel_id))
            await conn.commit()
        return True

    async def get_spam_settings(self, guild_id: int) -> Optional[Dict]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT max_messages, time_frame, log_channel_id, created_at, updated_at '
                    'FROM spam_settings WHERE guild_id = %s', (guild_id,))
                return await cur.fetchone()

    async def get_log_channel(self, guild_id: int) -> Optional[int]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT log_channel_id FROM spam_settings WHERE guild_id = %s', (guild_id,))
                result = await cur.fetchone()
                return result['log_channel_id'] if result and result['log_channel_id'] else None

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------

    async def log_spam(self, guild_id: int, user_id: int, message: str, message_count: int = 1) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO spam_logs (guild_id, user_id, message, message_count)
                    VALUES (%s, %s, %s, %s)
                ''', (guild_id, user_id, message[:1000], message_count))
            await conn.commit()
        return True

    async def get_spam_logs(self, guild_id: int, limit: int = 10) -> List[Dict]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute('''
                    SELECT user_id, message, message_count, timestamp
                    FROM spam_logs WHERE guild_id = %s
                    ORDER BY timestamp DESC LIMIT %s
                ''', (guild_id, limit))
                return await cur.fetchall()

    async def get_user_spam_history(self, guild_id: int, user_id: int,
                                    hours: int = 24, limit: int = 50) -> List[Dict]:
        await self.ensure_connection()
        cutoff_time = datetime.now() - timedelta(hours=hours)
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute('''
                    SELECT message, message_count, timestamp
                    FROM spam_logs
                    WHERE guild_id = %s AND user_id = %s AND timestamp > %s
                    ORDER BY timestamp DESC LIMIT %s
                ''', (guild_id, user_id, cutoff_time, limit))
                return await cur.fetchall()

    async def clear_spam_logs(self, guild_id: int, older_than_days: Optional[int] = None) -> int:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                if older_than_days:
                    cutoff_date = datetime.now() - timedelta(days=older_than_days)
                    await cur.execute(
                        'DELETE FROM spam_logs WHERE guild_id = %s AND timestamp < %s',
                        (guild_id, cutoff_date))
                else:
                    await cur.execute('DELETE FROM spam_logs WHERE guild_id = %s', (guild_id,))
                deleted = cur.rowcount
            await conn.commit()
        return deleted

    # ------------------------------------------------------------------
    # Whitelist
    # ------------------------------------------------------------------

    async def add_to_whitelist(self, guild_id: int, user_id: int,
                               added_by: Optional[int] = None, reason: Optional[str] = None) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT IGNORE INTO spam_whitelist (guild_id, user_id, added_by, reason)
                    VALUES (%s, %s, %s, %s)
                ''', (guild_id, user_id, added_by, reason))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    async def remove_from_whitelist(self, guild_id: int, user_id: int) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'DELETE FROM spam_whitelist WHERE guild_id = %s AND user_id = %s',
                    (guild_id, user_id))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    async def is_whitelisted(self, guild_id: int, user_id: int) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT 1 FROM spam_whitelist WHERE guild_id = %s AND user_id = %s',
                    (guild_id, user_id))
                return await cur.fetchone() is not None

    async def get_whitelist(self, guild_id: int) -> List[Dict]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT user_id, added_by, added_at, reason '
                    'FROM spam_whitelist WHERE guild_id = %s ORDER BY user_id',
                    (guild_id,))
                return await cur.fetchall()

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    async def get_guild_stats(self, guild_id: int) -> Dict:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT COUNT(*) AS total FROM spam_logs WHERE guild_id = %s', (guild_id,))
                total_logs = (await cur.fetchone())['total']

                yesterday = datetime.now() - timedelta(hours=24)
                await cur.execute(
                    'SELECT COUNT(*) AS recent FROM spam_logs WHERE guild_id = %s AND timestamp > %s',
                    (guild_id, yesterday))
                recent_logs = (await cur.fetchone())['recent']

                await cur.execute(
                    'SELECT COUNT(*) AS cnt FROM spam_whitelist WHERE guild_id = %s', (guild_id,))
                whitelist_count = (await cur.fetchone())['cnt']

                week_ago = datetime.now() - timedelta(days=7)
                await cur.execute('''
                    SELECT user_id, COUNT(*) AS spam_count, SUM(message_count) AS total_messages
                    FROM spam_logs
                    WHERE guild_id = %s AND timestamp > %s
                    GROUP BY user_id ORDER BY spam_count DESC LIMIT 5
                ''', (guild_id, week_ago))
                top_spammers = await cur.fetchall()

        return {
            'total_spam_logs': total_logs,
            'recent_spam_logs': recent_logs,
            'whitelist_count': whitelist_count,
            'top_spammers': [
                {'user_id': r['user_id'], 'spam_incidents': r['spam_count'],
                 'total_messages': r['total_messages']}
                for r in top_spammers
            ]
        }

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    async def cleanup_old_logs(self, days_to_keep: int = 30) -> int:
        await self.ensure_connection()
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('DELETE FROM spam_logs WHERE timestamp < %s', (cutoff_date,))
                deleted = cur.rowcount
            await conn.commit()
        if deleted > 0:
            self.logger.info(f"Cleaned up {deleted} old spam logs")
        return deleted

    async def delete_user_data(self, user_id: int) -> bool:
        await self.ensure_connection()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM spam_logs WHERE user_id = %s", (user_id,))
                    await cur.execute("DELETE FROM spam_whitelist WHERE user_id = %s", (user_id,))
                await conn.commit()
            return True
        except Exception as e:
            self.logger.error(f"Error deleting user data for {user_id}: {e}")
            return False

    async def cleanup_old_data(self, days: int = 30) -> int:
        return await self.cleanup_old_logs(days_to_keep=days)