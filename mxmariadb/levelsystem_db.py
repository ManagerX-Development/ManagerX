# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of LevelDatabase
import aiomysql
import logging
import time
from typing import Optional, List, Tuple, Dict, Any
from collections import defaultdict
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class AntiSpamDetector:
    """In-memory anti-spam (identical to aiosqlite version)."""
    def __init__(self):
        self.user_patterns = defaultdict(list)
        self.user_messages = defaultdict(list)

    def is_xp_farming(self, user_id: int, message_content: str, timestamp: float) -> bool:
        patterns = self.user_patterns[user_id]
        patterns = [(c, ts) for c, ts in patterns if timestamp - ts < 600]
        self.user_patterns[user_id] = patterns
        recent = [c for c, _ in patterns[-5:]]
        if recent.count(message_content) >= 3:
            return True
        if len(message_content.strip()) < 3:
            return True
        patterns.append((message_content, timestamp))
        return False

    def is_spam(self, user_id: int, current_time: float, max_messages: int = 5, time_window: int = 60) -> bool:
        msgs = self.user_messages[user_id]
        msgs = [t for t in msgs if current_time - t < time_window]
        self.user_messages[user_id] = msgs
        if len(msgs) >= max_messages:
            return True
        msgs.append(current_time)
        return False


class LevelDatabase(MariaConnector):
    """MariaDB-backed level system. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()
        self.anti_spam = AntiSpamDetector()
        self.level_roles_cache: Dict[int, Dict[int, int]] = {}
        self.enabled_guilds_cache: set = set()
        self.guild_configs_cache: Dict[int, Dict] = {}

    async def init_db(self):
        """Create tables and load caches."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS user_levels (
                        user_id BIGINT,
                        guild_id BIGINT,
                        xp BIGINT DEFAULT 0,
                        level INT DEFAULT 0,
                        messages BIGINT DEFAULT 0,
                        last_message DOUBLE DEFAULT 0,
                        prestige_level INT DEFAULT 0,
                        total_xp_earned BIGINT DEFAULT 0,
                        PRIMARY KEY (user_id, guild_id),
                        INDEX idx_guild_xp (guild_id, xp)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS level_roles (
                        guild_id BIGINT,
                        level INT,
                        role_id BIGINT,
                        is_temporary TINYINT(1) DEFAULT 0,
                        duration_hours INT DEFAULT 0,
                        PRIMARY KEY (guild_id, level, role_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS guild_settings_level (
                        guild_id BIGINT PRIMARY KEY,
                        levelsystem_enabled TINYINT(1) DEFAULT 1,
                        min_xp INT DEFAULT 10,
                        max_xp INT DEFAULT 20,
                        xp_cooldown INT DEFAULT 30,
                        level_up_channel BIGINT,
                        webhook_url TEXT,
                        prestige_enabled TINYINT(1) DEFAULT 1,
                        prestige_min_level INT DEFAULT 50
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS channel_settings_level (
                        guild_id BIGINT,
                        channel_id BIGINT,
                        xp_multiplier DOUBLE DEFAULT 1.0,
                        is_blacklisted TINYINT(1) DEFAULT 0,
                        PRIMARY KEY (guild_id, channel_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS xp_boosts (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT,
                        user_id BIGINT,
                        multiplier DOUBLE,
                        start_time DOUBLE,
                        end_time DOUBLE,
                        is_global TINYINT(1) DEFAULT 0,
                        INDEX idx_active (guild_id, start_time, end_time)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS achievements_level (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT,
                        user_id BIGINT,
                        achievement_type VARCHAR(50),
                        achievement_value INT,
                        earned_at DOUBLE,
                        UNIQUE KEY uq_ach (guild_id, user_id, achievement_type, achievement_value)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS temporary_roles (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        guild_id BIGINT,
                        user_id BIGINT,
                        role_id BIGINT,
                        granted_at DOUBLE,
                        expires_at DOUBLE
                    )
                ''')
            await conn.commit()
        await self.load_caches()
        logger.info("MariaDB levelsystem tables initialized")

    async def load_caches(self):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('SELECT guild_id, level, role_id FROM level_roles')
                for guild_id, level, role_id in await cur.fetchall():
                    if guild_id not in self.level_roles_cache:
                        self.level_roles_cache[guild_id] = {}
                    self.level_roles_cache[guild_id][level] = role_id

                await cur.execute('SELECT guild_id FROM guild_settings_level WHERE levelsystem_enabled = 1')
                self.enabled_guilds_cache = {r[0] for r in await cur.fetchall()}

                await cur.execute('SELECT * FROM guild_settings_level')
                for row in await cur.fetchall():
                    self.guild_configs_cache[row[0]] = {
                        'enabled': row[1], 'min_xp': row[2], 'max_xp': row[3],
                        'cooldown': row[4], 'level_up_channel': row[5], 'webhook_url': row[6],
                        'prestige_enabled': row[7] if len(row) > 7 else True,
                        'prestige_min_level': row[8] if len(row) > 8 else 50
                    }

    async def add_xp(self, user_id: int, guild_id: int, xp_amount: int,
                     message_content: str = "") -> Tuple[bool, int]:
        current_time = time.time()
        if self.anti_spam.is_spam(user_id, current_time):
            return False, 0
        if message_content and self.anti_spam.is_xp_farming(user_id, message_content, current_time):
            return False, 0

        xp_amount = int(xp_amount * await self.get_active_xp_multiplier(guild_id, user_id))

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT xp, level, messages, total_xp_earned FROM user_levels '
                    'WHERE user_id = %s AND guild_id = %s', (user_id, guild_id))
                result = await cur.fetchone()

                if result:
                    current_xp, current_level, messages, total_earned = result
                    new_xp = current_xp + xp_amount
                    new_level = self.calculate_level(new_xp)
                    await cur.execute('''
                        UPDATE user_levels
                        SET xp = %s, level = %s, messages = messages + 1,
                            last_message = %s, total_xp_earned = %s
                        WHERE user_id = %s AND guild_id = %s
                    ''', (new_xp, new_level, current_time, total_earned + xp_amount,
                          user_id, guild_id))
                    level_up = new_level > current_level
                else:
                    new_xp = xp_amount
                    new_level = self.calculate_level(new_xp)
                    await cur.execute('''
                        INSERT INTO user_levels
                        (user_id, guild_id, xp, level, messages, last_message, total_xp_earned)
                        VALUES (%s, %s, %s, %s, 1, %s, %s)
                    ''', (user_id, guild_id, new_xp, new_level, current_time, xp_amount))
                    level_up = new_level > 0
            await conn.commit()
        return level_up, new_level

    async def get_user_stats(self, user_id: int, guild_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT xp, level, messages, prestige_level, total_xp_earned '
                    'FROM user_levels WHERE user_id = %s AND guild_id = %s',
                    (user_id, guild_id))
                result = await cur.fetchone()
                if result:
                    xp, level, messages, prestige, total_earned = result
                    xp_needed = self.xp_for_level(level + 1) - xp
                    return xp, level, messages, xp_needed, prestige, total_earned
                return None

    async def get_leaderboard(self, guild_id: int, limit: int = 10) -> List[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT user_id, xp, level, messages, prestige_level '
                    'FROM user_levels WHERE guild_id = %s '
                    'ORDER BY prestige_level DESC, level DESC, xp DESC LIMIT %s',
                    (guild_id, limit))
                return await cur.fetchall()

    async def get_user_rank(self, user_id: int, guild_id: int) -> int:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT xp, level, prestige_level FROM user_levels '
                    'WHERE user_id = %s AND guild_id = %s', (user_id, guild_id))
                user = await cur.fetchone()
                if not user:
                    return 0
                xp, level, prestige = user
                await cur.execute('''
                    SELECT COUNT(*) + 1 FROM user_levels
                    WHERE guild_id = %s AND (
                        prestige_level > %s OR
                        (prestige_level = %s AND level > %s) OR
                        (prestige_level = %s AND level = %s AND xp > %s)
                    )
                ''', (guild_id, prestige, prestige, level, prestige, level, xp))
                return (await cur.fetchone())[0]

    async def get_active_xp_multiplier(self, guild_id: int, user_id: int) -> float:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                ct = time.time()
                await cur.execute('''
                    SELECT multiplier FROM xp_boosts
                    WHERE guild_id = %s AND (user_id = %s OR is_global = 1)
                    AND start_time <= %s AND end_time > %s
                    ORDER BY multiplier DESC LIMIT 1
                ''', (guild_id, user_id, ct, ct))
                result = await cur.fetchone()
                return result[0] if result else 1.0

    # --- Config ---

    async def set_guild_config(self, guild_id: int, **config):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                keys = list(config.keys()) + ['guild_id']
                values = list(config.values()) + [guild_id]
                placeholders = ', '.join(['%s'] * len(keys))
                update_clause = ', '.join([f"{k} = VALUES({k})" for k in config.keys()])
                await cur.execute(f"""
                    INSERT INTO guild_settings_level ({', '.join(keys)})
                    VALUES ({placeholders})
                    ON DUPLICATE KEY UPDATE {update_clause}
                """, values)
            await conn.commit()
        if guild_id not in self.guild_configs_cache:
            self.guild_configs_cache[guild_id] = {}
        self.guild_configs_cache[guild_id].update(config)

    async def get_guild_config(self, guild_id: int) -> Dict[str, Any]:
        if guild_id in self.guild_configs_cache:
            return self.guild_configs_cache[guild_id]
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('SELECT * FROM guild_settings_level WHERE guild_id = %s', (guild_id,))
                result = await cur.fetchone()
                if result:
                    config = {
                        'enabled': result[1], 'min_xp': result[2], 'max_xp': result[3],
                        'cooldown': result[4], 'level_up_channel': result[5],
                        'webhook_url': result[6],
                        'prestige_enabled': result[7] if len(result) > 7 else True,
                        'prestige_min_level': result[8] if len(result) > 8 else 50
                    }
                else:
                    config = {'enabled': True, 'min_xp': 10, 'max_xp': 20, 'cooldown': 30,
                              'level_up_channel': None, 'webhook_url': None,
                              'prestige_enabled': True, 'prestige_min_level': 50}
        self.guild_configs_cache[guild_id] = config
        return config

    # --- Level Roles ---

    async def add_level_role(self, guild_id: int, level: int, role_id: int,
                             is_temporary: bool = False, duration_hours: int = 0):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO level_roles (guild_id, level, role_id, is_temporary, duration_hours)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE role_id = VALUES(role_id),
                        is_temporary = VALUES(is_temporary), duration_hours = VALUES(duration_hours)
                ''', (guild_id, level, role_id, is_temporary, duration_hours))
            await conn.commit()
        if guild_id not in self.level_roles_cache:
            self.level_roles_cache[guild_id] = {}
        self.level_roles_cache[guild_id][level] = role_id

    async def remove_level_role(self, guild_id: int, level: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'DELETE FROM level_roles WHERE guild_id = %s AND level = %s',
                    (guild_id, level))
            await conn.commit()
        if guild_id in self.level_roles_cache and level in self.level_roles_cache[guild_id]:
            del self.level_roles_cache[guild_id][level]

    async def get_level_roles(self, guild_id: int) -> List[Tuple]:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT level, role_id, is_temporary, duration_hours FROM level_roles '
                    'WHERE guild_id = %s ORDER BY level ASC', (guild_id,))
                return await cur.fetchall()

    def get_role_for_level(self, guild_id: int, level: int) -> Optional[int]:
        if guild_id in self.level_roles_cache:
            applicable = {l: r for l, r in self.level_roles_cache[guild_id].items() if l <= level}
            if applicable:
                return applicable[max(applicable.keys())]
        return None

    async def set_levelsystem_enabled(self, guild_id: int, enabled: bool):
        await self.set_guild_config(guild_id, levelsystem_enabled=enabled)
        if enabled:
            self.enabled_guilds_cache.add(guild_id)
        else:
            self.enabled_guilds_cache.discard(guild_id)

    def is_levelsystem_enabled(self, guild_id: int) -> bool:
        return guild_id in self.enabled_guilds_cache

    # --- Helpers ---

    @staticmethod
    def calculate_level(xp: int) -> int:
        level = 0
        while xp >= LevelDatabase.xp_for_level(level + 1):
            level += 1
        return level

    @staticmethod
    def xp_for_level(level: int) -> int:
        if level == 0:
            return 0
        return int(100 * (level ** 1.5))

    # --- Maintenance ---

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('DELETE FROM user_levels WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM achievements_level WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM xp_boosts WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM temporary_roles WHERE user_id = %s', (user_id,))
                await conn.commit()
            return True
        except Exception:
            return False

    async def cleanup_old_data(self, days: int = 30) -> int:
        cutoff = time.time() - (days * 86400)
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('DELETE FROM xp_boosts WHERE end_time < %s', (cutoff,))
                    await cur.execute('DELETE FROM temporary_roles WHERE expires_at < %s', (cutoff,))
                    deleted = cur.rowcount
                await conn.commit()
            return deleted
        except Exception:
            return 0
