# Copyright (c) 2025 OPPRO.NET Network
import aiomysql
import logging
from typing import Optional, Dict, List
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class LoggingDatabase(MariaConnector):

    def __init__(self):
        super().__init__()

    async def init_db(self):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS log_channels (
                            guild_id   BIGINT      NOT NULL,
                            log_type   VARCHAR(50) NOT NULL,
                            channel_id BIGINT      NOT NULL,
                            enabled    TINYINT(1)  DEFAULT 1,
                            created_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            PRIMARY KEY (guild_id, log_type),
                            INDEX idx_guild_enabled (guild_id, enabled),
                            INDEX idx_channel_id    (channel_id)
                        )
                    ''')
                await conn.commit()
            logger.info("LoggingDatabase: Tabellen initialisiert.")
        except Exception as e:
            logger.critical(f"LoggingDatabase.init_db() fehlgeschlagen: {e}")
            raise

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def set_log_channel(self, guild_id: int, channel_id: int, log_type: str = 'general'):
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO log_channels (guild_id, log_type, channel_id, enabled)
                    VALUES (%s, %s, %s, 1)
                    ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), enabled = 1
                ''', (guild_id, log_type, channel_id))
            await conn.commit()

    async def remove_log_channel(self, guild_id: int, log_type: str = None) -> int:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                if log_type:
                    await cur.execute(
                        'DELETE FROM log_channels WHERE guild_id = %s AND log_type = %s',
                        (guild_id, log_type))
                else:
                    await cur.execute(
                        'DELETE FROM log_channels WHERE guild_id = %s', (guild_id,))
                deleted = cur.rowcount
            await conn.commit()
        return deleted

    async def remove_all_log_channels(self, guild_id: int) -> int:
        return await self.remove_log_channel(guild_id)

    async def disable_logging(self, guild_id: int, log_type: str = None) -> int:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                if log_type:
                    await cur.execute(
                        'UPDATE log_channels SET enabled = 0 WHERE guild_id = %s AND log_type = %s',
                        (guild_id, log_type))
                else:
                    await cur.execute(
                        'UPDATE log_channels SET enabled = 0 WHERE guild_id = %s', (guild_id,))
                updated = cur.rowcount
            await conn.commit()
        return updated

    async def enable_logging(self, guild_id: int, log_type: str = None) -> int:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                if log_type:
                    await cur.execute(
                        'UPDATE log_channels SET enabled = 1 WHERE guild_id = %s AND log_type = %s',
                        (guild_id, log_type))
                else:
                    await cur.execute(
                        'UPDATE log_channels SET enabled = 1 WHERE guild_id = %s', (guild_id,))
                updated = cur.rowcount
            await conn.commit()
        return updated

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_log_channel(self, guild_id: int, log_type: str = 'general') -> Optional[int]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    SELECT channel_id FROM log_channels
                    WHERE guild_id = %s AND log_type = %s AND enabled = 1
                ''', (guild_id, log_type))
                row = await cur.fetchone()
                return row[0] if row else None

    async def get_all_log_channels(self, guild_id: int) -> Dict[str, int]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    SELECT log_type, channel_id FROM log_channels
                    WHERE guild_id = %s AND enabled = 1 ORDER BY log_type
                ''', (guild_id,))
                return dict(await cur.fetchall())

    async def channel_exists(self, guild_id: int, log_type: str) -> bool:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT 1 FROM log_channels WHERE guild_id = %s AND log_type = %s',
                    (guild_id, log_type))
                return await cur.fetchone() is not None

    async def get_guilds_with_logging(self) -> List[int]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT DISTINCT guild_id FROM log_channels WHERE enabled = 1')
                return [r[0] for r in await cur.fetchall()]

    async def get_channels_by_guild(self, guild_id: int) -> List[Dict]:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute('''
                    SELECT log_type, channel_id, enabled, created_at, updated_at
                    FROM log_channels WHERE guild_id = %s ORDER BY log_type
                ''', (guild_id,))
                return await cur.fetchall()

    async def cleanup_invalid_channels(self, valid_channel_ids: set) -> int:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                if not valid_channel_ids:
                    await cur.execute('DELETE FROM log_channels')
                else:
                    placeholders = ','.join(['%s'] * len(valid_channel_ids))
                    await cur.execute(
                        f'DELETE FROM log_channels WHERE channel_id NOT IN ({placeholders})',
                        list(valid_channel_ids))
                deleted = cur.rowcount
            await conn.commit()
        return deleted

    async def get_statistics(self) -> Dict:
        await self.ensure_connection()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                stats = {}
                await cur.execute('SELECT COUNT(*) FROM log_channels')
                stats['total_entries'] = (await cur.fetchone())[0]
                await cur.execute('SELECT COUNT(*) FROM log_channels WHERE enabled = 1')
                stats['enabled_entries'] = (await cur.fetchone())[0]
                await cur.execute('SELECT COUNT(DISTINCT guild_id) FROM log_channels')
                stats['unique_guilds'] = (await cur.fetchone())[0]
                await cur.execute('SELECT COUNT(DISTINCT channel_id) FROM log_channels')
                stats['unique_channels'] = (await cur.fetchone())[0]
                await cur.execute('''
                    SELECT log_type, COUNT(*) FROM log_channels
                    WHERE enabled = 1 GROUP BY log_type
                ''')
                stats['log_types'] = dict(await cur.fetchall())
                return stats

    async def backup_database(self, path: str) -> bool:
        """Placeholder – MariaDB-Backups laufen extern via mysqldump."""
        logger.info(f"Backup angefragt nach: {path} (extern via mysqldump empfohlen)")
        return False

    async def delete_user_data(self, user_id: int) -> bool:
        return True

    async def cleanup_old_data(self, days: int = 30) -> int:
        return 0

    def close(self):
        pass