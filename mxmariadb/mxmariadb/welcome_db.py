# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of WelcomeDatabase
import aiomysql
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from mxmariadb.connector import MariaConnector
logger = logging.getLogger(__name__)


class WelcomeDatabase(MariaConnector):
    """MariaDB-backed welcome database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()
        self.migration_done = False

    async def init_db(self):
        """Create tables and run migrations."""
        await self._create_tables()
        self.migration_done = True

    async def _create_tables(self):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS welcome_settings (
                        guild_id BIGINT PRIMARY KEY,
                        channel_id BIGINT,
                        welcome_message TEXT,
                        enabled TINYINT(1) DEFAULT 1,
                        embed_enabled TINYINT(1) DEFAULT 0,
                        embed_color VARCHAR(10) DEFAULT '#00ff00',
                        embed_title VARCHAR(255),
                        embed_description TEXT,
                        embed_thumbnail TINYINT(1) DEFAULT 0,
                        embed_footer VARCHAR(255),
                        ping_user TINYINT(1) DEFAULT 0,
                        delete_after INT DEFAULT 0,
                        auto_role_id BIGINT,
                        join_dm_enabled TINYINT(1) DEFAULT 0,
                        join_dm_message TEXT,
                        template_name VARCHAR(100),
                        welcome_stats_enabled TINYINT(1) DEFAULT 0,
                        rate_limit_enabled TINYINT(1) DEFAULT 1,
                        rate_limit_seconds INT DEFAULT 60,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS welcome_stats (
                        guild_id BIGINT,
                        date VARCHAR(20),
                        joins INT DEFAULT 0,
                        leaves_ INT DEFAULT 0,
                        PRIMARY KEY (guild_id, date)
                    )
                ''')
            await conn.commit()
        logger.info("MariaDB welcome tables initialized")

    # --- Backwards‑compat helpers ---

    async def set_welcome_channel(self, guild_id: int, channel_id: int) -> bool:
        return await self.update_welcome_settings(guild_id, channel_id=channel_id)

    async def set_welcome_message(self, guild_id: int, message: str) -> bool:
        return await self.update_welcome_settings(guild_id, welcome_message=message)

    # --- Core CRUD ---

    async def update_welcome_settings(self, guild_id: int, **kwargs) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        'SELECT guild_id FROM welcome_settings WHERE guild_id = %s',
                        (guild_id,))
                    if not await cur.fetchone():
                        await cur.execute(
                            'INSERT INTO welcome_settings (guild_id) VALUES (%s)',
                            (guild_id,))

                    valid_fields = [
                        'channel_id', 'welcome_message', 'enabled',
                        'embed_enabled', 'embed_color', 'embed_title',
                        'embed_description', 'embed_thumbnail', 'embed_footer',
                        'ping_user', 'delete_after', 'auto_role_id',
                        'join_dm_enabled', 'join_dm_message', 'template_name',
                        'welcome_stats_enabled', 'rate_limit_enabled',
                        'rate_limit_seconds',
                    ]

                    updates = []
                    values = []
                    for key, value in kwargs.items():
                        if key in valid_fields:
                            updates.append(f"{key} = %s")
                            values.append(value)

                    if updates:
                        query = (
                            f"UPDATE welcome_settings SET {', '.join(updates)} "
                            f"WHERE guild_id = %s"
                        )
                        values.append(guild_id)
                        await cur.execute(query, values)
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error updating welcome settings: {e}")
            return False

    async def get_welcome_settings(self, guild_id: int) -> Optional[Dict[str, Any]]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute(
                        'SELECT * FROM welcome_settings WHERE guild_id = %s',
                        (guild_id,))
                    result = await cur.fetchone()
                    return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error getting welcome settings: {e}")
            return None

    async def delete_welcome_settings(self, guild_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        'DELETE FROM welcome_settings WHERE guild_id = %s',
                        (guild_id,))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting welcome settings: {e}")
            return False

    async def toggle_welcome(self, guild_id: int) -> Optional[bool]:
        try:
            settings = await self.get_welcome_settings(guild_id)
            if not settings:
                return None
            new_state = not settings.get('enabled', True)
            await self.update_welcome_settings(guild_id, enabled=new_state)
            return new_state
        except Exception as e:
            logger.error(f"Toggle error: {e}")
            return None

    # --- Stats ---

    async def update_welcome_stats(self, guild_id: int,
                                   joins: int = 0, leaves: int = 0):
        try:
            date = datetime.now().strftime('%Y-%m-%d')
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('''
                        INSERT INTO welcome_stats (guild_id, date, joins, leaves_)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            joins = joins + VALUES(joins),
                            leaves_ = leaves_ + VALUES(leaves_)
                    ''', (guild_id, date, joins, leaves))
                await conn.commit()
        except Exception as e:
            logger.error(f"Stats update error: {e}")

    async def get_weekly_stats(self, guild_id: int) -> List[Dict]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute('''
                        SELECT date, joins, leaves_ AS leaves
                        FROM welcome_stats
                        WHERE guild_id = %s
                          AND date > DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                        ORDER BY date ASC
                    ''', (guild_id,))
                    return [dict(r) for r in await cur.fetchall()]
        except Exception as e:
            logger.error(f"Get weekly stats error: {e}")
            return []

    # --- Migration placeholder (no-op, tables are correct from start) ---

    async def migrate_database(self):
        pass
