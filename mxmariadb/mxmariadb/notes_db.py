# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of NotesDatabase
import aiomysql
import logging
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class NotesDatabase(MariaConnector):
    """MariaDB-backed notes database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create table."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS notes (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT,
                        user_id BIGINT,
                        author_id BIGINT,
                        author_name VARCHAR(255),
                        note TEXT,
                        timestamp VARCHAR(50),
                        INDEX idx_guild_user (guild_id, user_id)
                    )
                """)
            await conn.commit()
        logger.info("MariaDB notes tables initialized")

    async def add_note(self, guild_id: int, user_id: int, author_id: int,
                       author_name: str, note: str, timestamp: str):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO notes (guild_id, user_id, author_id, author_name, note, timestamp) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (guild_id, user_id, author_id, author_name, note, timestamp))
            await conn.commit()

    async def get_notes(self, guild_id: int, user_id: int) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT id, note, timestamp, author_name FROM notes "
                    "WHERE guild_id = %s AND user_id = %s",
                    (guild_id, user_id))
                rows = await cur.fetchall()
                return [
                    {"id": r[0], "content": r[1], "timestamp": r[2], "author_name": r[3]}
                    for r in rows
                ]

    async def delete_note(self, note_id: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM notes WHERE id = %s", (note_id,))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    async def get_note_by_id(self, note_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM notes WHERE id = %s", (note_id,))
                return await cur.fetchone()

    # --- Maintenance ---

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM notes WHERE user_id = %s", (user_id,))
                await conn.commit()
            return True
        except Exception:
            return False

    async def cleanup_old_data(self, days: int = 30) -> int:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM notes WHERE timestamp < %s", (cutoff,))
                    count = cur.rowcount
                await conn.commit()
            return count
        except Exception:
            return 0
