# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of AutoRoleDatabase
import aiomysql
import random
import string
import logging
from typing import Optional, List, Dict
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class AutoRoleDatabase(MariaConnector):
    """MariaDB-backed autorole database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create table if it doesn't exist."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS autoroles (
                        autorole_id VARCHAR(20) PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        role_id BIGINT NOT NULL,
                        enabled TINYINT(1) DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_guild (guild_id)
                    )
                """)
            await conn.commit()
        logger.info("MariaDB autorole tables initialized")

    def generate_autorole_id(self, guild_id: int, role_id: int) -> str:
        guild_part = str(guild_id)[-2:].zfill(2)
        role_part = str(role_id)[-2:].zfill(2)
        random_part = ''.join(random.choices(string.digits, k=3))
        return f"{guild_part}-{role_part}-{random_part}"

    async def add_autorole(self, guild_id: int, role_id: int) -> str:
        await self.init_db()
        autorole_id = self.generate_autorole_id(guild_id, role_id)

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Ensure unique ID
                while True:
                    await cur.execute(
                        "SELECT autorole_id FROM autoroles WHERE autorole_id = %s",
                        (autorole_id,))
                    if not await cur.fetchone():
                        break
                    autorole_id = self.generate_autorole_id(guild_id, role_id)

                await cur.execute("""
                    INSERT INTO autoroles (autorole_id, guild_id, role_id, enabled)
                    VALUES (%s, %s, %s, 1)
                """, (autorole_id, guild_id, role_id))
            await conn.commit()
        return autorole_id

    async def get_all_autoroles(self, guild_id: int) -> List[Dict]:
        await self.init_db()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT autorole_id, role_id, enabled FROM autoroles WHERE guild_id = %s",
                    (guild_id,))
                rows = await cur.fetchall()
                return [{"autorole_id": r['autorole_id'], "role_id": r['role_id'],
                         "enabled": bool(r['enabled'])} for r in rows]

    async def get_autorole(self, autorole_id: str) -> Optional[Dict]:
        await self.init_db()
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT autorole_id, guild_id, role_id, enabled FROM autoroles WHERE autorole_id = %s",
                    (autorole_id,))
                row = await cur.fetchone()
                if row:
                    return {"autorole_id": row['autorole_id'], "guild_id": row['guild_id'],
                            "role_id": row['role_id'], "enabled": bool(row['enabled'])}
                return None

    async def get_enabled_autoroles(self, guild_id: int) -> List[int]:
        await self.init_db()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT role_id FROM autoroles WHERE guild_id = %s AND enabled = 1",
                    (guild_id,))
                rows = await cur.fetchall()
                return [r[0] for r in rows]

    async def remove_autorole(self, autorole_id: str):
        await self.init_db()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM autoroles WHERE autorole_id = %s", (autorole_id,))
            await conn.commit()

    async def toggle_autorole(self, autorole_id: str, enabled: bool):
        await self.init_db()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "UPDATE autoroles SET enabled = %s WHERE autorole_id = %s",
                    (1 if enabled else 0, autorole_id))
            await conn.commit()
