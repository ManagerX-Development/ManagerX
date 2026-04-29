# Copyright (c) 2025 OPPRO.NET Network
import aiomysql
import logging
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)

class ManagementDatabase(MariaConnector):
    """MariaDB class for Auto-Responder, News-Sync, and Applications."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Initialize tables using the connector's lifecycle."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Auto-Responder Table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS auto_responder (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        keyword VARCHAR(255) NOT NULL,
                        response TEXT NOT NULL,
                        match_type VARCHAR(50) DEFAULT 'partial',
                        INDEX(guild_id, keyword)
                    )
                """)
                # News-Sync Table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS news_sync (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        channel_id BIGINT NOT NULL,
                        is_master BOOLEAN DEFAULT FALSE,
                        sync_group VARCHAR(100) DEFAULT 'default',
                        INDEX(guild_id, channel_id, sync_group)
                    )
                """)
                # Application Questions Table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS app_questions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        question_text TEXT NOT NULL,
                        order_idx INT DEFAULT 0,
                        INDEX(guild_id)
                    )
                """)
                # Application Submissions
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS app_submissions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        content TEXT NOT NULL,
                        status VARCHAR(50) DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX(guild_id, user_id)
                    )
                """)
            await conn.commit()
        logger.info("Management tables initialized in MariaDB")

    # --- Auto-Responder Methods ---
    async def add_auto_response(self, guild_id: int, keyword: str, response: str, match_type: str = 'partial'):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO auto_responder (guild_id, keyword, response, match_type) VALUES (%s, %s, %s, %s)",
                    (guild_id, keyword.lower(), response, match_type)
                )
            await conn.commit()

    async def remove_auto_response(self, guild_id: int, responder_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "DELETE FROM auto_responder WHERE id = %s AND guild_id = %s",
                    (responder_id, guild_id)
                )
            await conn.commit()

    async def get_auto_responses(self, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT id, keyword, response, match_type FROM auto_responder WHERE guild_id = %s",
                    (guild_id,)
                )
                return await cur.fetchall()

    # --- News-Sync Methods ---
    async def add_sync_channel(self, guild_id: int, channel_id: int, is_master: bool = False, sync_group: str = 'default'):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO news_sync (guild_id, channel_id, is_master, sync_group) VALUES (%s, %s, %s, %s)",
                    (guild_id, channel_id, is_master, sync_group)
                )
            await conn.commit()

    async def get_sync_channels(self, sync_group: str = None):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                if sync_group:
                    await cur.execute("SELECT guild_id, channel_id, is_master, sync_group FROM news_sync WHERE sync_group = %s", (sync_group,))
                else:
                    await cur.execute("SELECT guild_id, channel_id, is_master, sync_group FROM news_sync")
                return await cur.fetchall()

    # --- Application Methods ---
    async def add_question(self, guild_id: int, text: str, order: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO app_questions (guild_id, question_text, order_idx) VALUES (%s, %s, %s)",
                    (guild_id, text, order)
                )
            await conn.commit()

    async def get_questions(self, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT id, question_text FROM app_questions WHERE guild_id = %s ORDER BY order_idx ASC",
                    (guild_id,)
                )
                return await cur.fetchall()
    
    async def clear_questions(self, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM app_questions WHERE guild_id = %s", (guild_id,))
            await conn.commit()
