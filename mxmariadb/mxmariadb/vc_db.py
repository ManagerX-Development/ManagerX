# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of TempVCDatabase
import aiomysql
import logging
from typing import Optional, Tuple, List
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class TempVCDatabase(MariaConnector):
    """MariaDB-backed TempVC database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create tables."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS tempvc_settings (
                        guild_id BIGINT PRIMARY KEY,
                        creator_channel_id BIGINT NOT NULL,
                        category_id BIGINT NOT NULL,
                        auto_delete_time INT DEFAULT 0
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS temp_channels (
                        channel_id BIGINT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        owner_id BIGINT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_guild (guild_id),
                        INDEX idx_owner (owner_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS ui_settings (
                        guild_id BIGINT PRIMARY KEY,
                        ui_enabled TINYINT(1) DEFAULT 0,
                        ui_prefix VARCHAR(10) DEFAULT '🔧'
                    )
                ''')
            await conn.commit()
        logger.info("MariaDB tempvc tables initialized")

    async def set_tempvc_settings(self, guild_id: int, creator_channel_id: int,
                                  category_id: int, auto_delete_time: int = 0):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO tempvc_settings (guild_id, creator_channel_id, category_id, auto_delete_time)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        creator_channel_id = VALUES(creator_channel_id),
                        category_id = VALUES(category_id),
                        auto_delete_time = VALUES(auto_delete_time)
                ''', (guild_id, creator_channel_id, category_id, auto_delete_time))
            await conn.commit()

    async def get_tempvc_settings(self, guild_id: int) -> Optional[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT creator_channel_id, category_id, auto_delete_time '
                    'FROM tempvc_settings WHERE guild_id = %s', (guild_id,))
                return await cur.fetchone()

    async def remove_tempvc_settings(self, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('DELETE FROM tempvc_settings WHERE guild_id = %s', (guild_id,))
                await cur.execute('DELETE FROM temp_channels WHERE guild_id = %s', (guild_id,))
                await cur.execute('DELETE FROM ui_settings WHERE guild_id = %s', (guild_id,))
            await conn.commit()

    async def add_temp_channel(self, channel_id: int, guild_id: int, owner_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'INSERT INTO temp_channels (channel_id, guild_id, owner_id) VALUES (%s, %s, %s)',
                    (channel_id, guild_id, owner_id))
            await conn.commit()

    async def remove_temp_channel(self, channel_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('DELETE FROM temp_channels WHERE channel_id = %s', (channel_id,))
            await conn.commit()

    async def is_temp_channel(self, channel_id: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT 1 FROM temp_channels WHERE channel_id = %s', (channel_id,))
                return await cur.fetchone() is not None

    async def get_temp_channel_owner(self, channel_id: int) -> Optional[int]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT owner_id FROM temp_channels WHERE channel_id = %s', (channel_id,))
                result = await cur.fetchone()
                return result[0] if result else None

    async def get_all_temp_channels(self, guild_id: int) -> List[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT channel_id, owner_id, created_at FROM temp_channels WHERE guild_id = %s',
                    (guild_id,))
                return await cur.fetchall()

    async def update_channel_activity(self, channel_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'UPDATE temp_channels SET last_activity = NOW() WHERE channel_id = %s',
                    (channel_id,))
            await conn.commit()

    async def get_channels_to_delete(self, guild_id: int, minutes_inactive: int) -> List[int]:
        if minutes_inactive <= 0:
            return []
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    SELECT channel_id FROM temp_channels
                    WHERE guild_id = %s
                    AND DATE_ADD(last_activity, INTERVAL %s MINUTE) < NOW()
                ''', (guild_id, minutes_inactive))
                return [r[0] for r in await cur.fetchall()]

    # --- UI Settings ---

    async def set_ui_settings(self, guild_id: int, ui_enabled: bool, ui_prefix: str = "🔧"):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO ui_settings (guild_id, ui_enabled, ui_prefix) VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE ui_enabled = VALUES(ui_enabled), ui_prefix = VALUES(ui_prefix)
                ''', (guild_id, ui_enabled, ui_prefix))
            await conn.commit()

    async def get_ui_settings(self, guild_id: int) -> Optional[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT ui_enabled, ui_prefix FROM ui_settings WHERE guild_id = %s', (guild_id,))
                return await cur.fetchone()

    async def remove_ui_settings(self, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('DELETE FROM ui_settings WHERE guild_id = %s', (guild_id,))
            await conn.commit()

    # --- Maintenance ---

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('DELETE FROM temp_channels WHERE owner_id = %s', (user_id,))
                await conn.commit()
            return True
        except Exception:
            return False
