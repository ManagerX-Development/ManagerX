# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of SettingsDB
import aiomysql
import logging
from typing import Dict
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class SettingsDB(MariaConnector):
    """MariaDB-backed settings database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create tables."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS user_settings (
                        user_id BIGINT PRIMARY KEY,
                        language VARCHAR(10) NOT NULL DEFAULT 'en'
                    )
                """)
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS guild_settings_core (
                        guild_id BIGINT PRIMARY KEY,
                        user_role_id BIGINT,
                        team_role_id BIGINT,
                        language VARCHAR(10) NOT NULL DEFAULT 'de'
                    )
                """)
            await conn.commit()
        logger.info("MariaDB settings tables initialized")

    async def set_user_language(self, user_id: int, lang_code: str):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO user_settings (user_id, language) VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE language = VALUES(language)
                """, (user_id, lang_code))
            await conn.commit()

    async def get_user_language(self, user_id: int) -> str:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT language FROM user_settings WHERE user_id = %s", (user_id,))
                result = await cur.fetchone()
                return result[0] if result else 'en'

    # --- Guild Settings ---

    async def get_guild_settings(self, guild_id: int) -> Dict:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    "SELECT user_role_id, team_role_id, language FROM guild_settings_core WHERE guild_id = %s",
                    (guild_id,))
                result = await cur.fetchone()
                if result:
                    return dict(result)
                return {"user_role_id": None, "team_role_id": None, "language": "de"}

    async def update_guild_settings(self, guild_id: int, **kwargs):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT guild_id FROM guild_settings_core WHERE guild_id = %s", (guild_id,))
                if not await cur.fetchone():
                    await cur.execute(
                        "INSERT INTO guild_settings_core (guild_id) VALUES (%s)", (guild_id,))
                for key, value in kwargs.items():
                    if key in ["user_role_id", "team_role_id", "language"]:
                        await cur.execute(
                            f"UPDATE guild_settings_core SET {key} = %s WHERE guild_id = %s",
                            (value, guild_id))
            await conn.commit()

    async def get_guild_language(self, guild_id: int) -> str:
        settings = await self.get_guild_settings(guild_id)
        return settings.get("language", "de")

    async def set_guild_language(self, guild_id: int, lang_code: str):
        await self.update_guild_settings(guild_id, language=lang_code)

    # --- Maintenance ---

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM user_settings WHERE user_id = %s", (user_id,))
                await conn.commit()
            return True
        except Exception:
            return False

    def close(self):
        pass
