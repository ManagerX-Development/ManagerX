# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of WarnDatabase
import aiomysql
import logging
from datetime import datetime, timedelta
from typing import List, Tuple
from mxmariadb.connector import MariaConnector
logger = logging.getLogger(__name__)


class WarnDatabase(MariaConnector):
    """MariaDB-backed warn database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create table."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS warns (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        moderator_id BIGINT NOT NULL,
                        reason TEXT NOT NULL,
                        timestamp VARCHAR(50) NOT NULL,
                        INDEX idx_guild_user (guild_id, user_id)
                    )
                """)
            await conn.commit()
        logger.info("MariaDB warns tables initialized")

    async def add_warning(self, guild_id: int, user_id: int,
                          moderator_id: int, reason: str,
                          timestamp: str = None) -> int:
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO warns (guild_id, user_id, moderator_id, reason, timestamp) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (guild_id, user_id, moderator_id, reason, timestamp))
                last_id = cur.lastrowid
            await conn.commit()
        return last_id

    async def get_warnings(self, guild_id: int, user_id: int) -> List[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT id, reason, timestamp, moderator_id FROM warns "
                    "WHERE guild_id = %s AND user_id = %s ORDER BY id DESC",
                    (guild_id, user_id))
                return await cur.fetchall()

    # --- Privacy & Maintenance ---

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "DELETE FROM warns WHERE user_id = %s", (user_id,))
                await conn.commit()
            return True
        except Exception as e:
            logger.error(f"Hard Delete Error: {e}")
            return False

    async def cleanup_old_data(self, days: int = 180) -> int:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "DELETE FROM warns WHERE timestamp < %s", (cutoff,))
                    count = cur.rowcount
                await conn.commit()
            if count > 0:
                logger.info(f"[Cleanup] {count} warnings older than {days} days deleted")
            return count
        except Exception as e:
            logger.error(f"Cleanup Error: {e}")
            return 0
