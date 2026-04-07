# Copyright (c) 2025 OPPRO.NET Network
import aiomysql
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Tuple, Dict
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class StatsDB(MariaConnector):

    def __init__(self):
        super().__init__()
        self.lock = asyncio.Lock()

    async def init_db(self):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS messages (
                            id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                            user_id         BIGINT   NOT NULL,
                            guild_id        BIGINT   NOT NULL,
                            channel_id      BIGINT   NOT NULL,
                            message_id      BIGINT   NOT NULL,
                            timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP,
                            word_count      INT      DEFAULT 0,
                            has_attachment  TINYINT(1) DEFAULT 0,
                            message_type    VARCHAR(20) DEFAULT 'text',
                            INDEX idx_user_ts  (user_id,  timestamp),
                            INDEX idx_guild_ts (guild_id, timestamp)
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS voice_sessions (
                            id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                            user_id          BIGINT NOT NULL,
                            guild_id         BIGINT NOT NULL,
                            channel_id       BIGINT NOT NULL,
                            start_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
                            end_time         DATETIME,
                            duration_minutes DOUBLE DEFAULT 0,
                            INDEX idx_user_ts (user_id, start_time)
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS global_user_levels (
                            user_id              BIGINT PRIMARY KEY,
                            global_level         INT    DEFAULT 1,
                            global_xp            DOUBLE DEFAULT 0,
                            total_messages       BIGINT DEFAULT 0,
                            total_voice_minutes  DOUBLE DEFAULT 0,
                            total_servers        INT    DEFAULT 0,
                            first_seen           DATETIME DEFAULT CURRENT_TIMESTAMP,
                            last_activity        DATETIME DEFAULT CURRENT_TIMESTAMP,
                            achievements         TEXT DEFAULT '[]',
                            daily_streak         INT  DEFAULT 0,
                            best_streak          INT  DEFAULT 0,
                            last_daily_activity  DATE,
                            is_private           TINYINT(1) DEFAULT 0,
                            INDEX idx_xp (global_xp)
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS daily_stats (
                            id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                            guild_id       BIGINT NOT NULL,
                            date           DATE   NOT NULL,
                            messages_count BIGINT DEFAULT 0,
                            voice_minutes  DOUBLE DEFAULT 0,
                            UNIQUE KEY uq_guild_date (guild_id, date)
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS channel_stats (
                            id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
                            channel_id            BIGINT NOT NULL,
                            guild_id              BIGINT NOT NULL,
                            date                  DATE   NOT NULL,
                            total_messages        BIGINT DEFAULT 0,
                            unique_users          INT    DEFAULT 0,
                            avg_words_per_message DOUBLE DEFAULT 0,
                            UNIQUE KEY uq_channel_date (channel_id, date)
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS user_achievements (
                            id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                            user_id          BIGINT       NOT NULL,
                            achievement_name VARCHAR(100) NOT NULL,
                            unlocked_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
                            description      TEXT,
                            icon             VARCHAR(10)  DEFAULT '🏆'
                        )
                    ''')
                    await cur.execute('''
                        CREATE TABLE IF NOT EXISTS active_voice_sessions (
                            user_id    BIGINT PRIMARY KEY,
                            guild_id   BIGINT NOT NULL,
                            channel_id BIGINT NOT NULL,
                            start_time DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')
                await conn.commit()
            logger.info("StatsDB: Tabellen initialisiert.")
        except Exception as e:
            logger.critical(f"StatsDB.init_db() fehlgeschlagen: {e}")
            raise

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def log_message(self, user_id: int, guild_id: int, channel_id: int, message_id: int,
                          word_count: int = 0, has_attachment: bool = False, message_type: str = 'text'):
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute('''
                            INSERT INTO messages (user_id, guild_id, channel_id, message_id,
                                                  word_count, has_attachment, message_type)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ''', (user_id, guild_id, channel_id, message_id,
                              word_count, has_attachment, message_type))

                        today = datetime.now().date()
                        await cur.execute('''
                            INSERT INTO daily_stats (guild_id, date, messages_count)
                            VALUES (%s, %s, 1)
                            ON DUPLICATE KEY UPDATE messages_count = messages_count + 1
                        ''', (guild_id, today))

                        await self._update_global_xp(cur, user_id, guild_id, 'message', word_count)
                    await conn.commit()
            except Exception as e:
                logger.error(f"log_message fehlgeschlagen: {e}")

    async def start_voice_session(self, user_id: int, guild_id: int, channel_id: int):
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute(
                            'SELECT channel_id FROM active_voice_sessions WHERE user_id = %s',
                            (user_id,))
                        if await cur.fetchone():
                            await self._end_voice_internal(cur, user_id)

                        await cur.execute('''
                            INSERT INTO active_voice_sessions (user_id, guild_id, channel_id)
                            VALUES (%s, %s, %s)
                        ''', (user_id, guild_id, channel_id))
                    await conn.commit()
            except Exception as e:
                logger.error(f"start_voice_session fehlgeschlagen: {e}")

    async def end_voice_session(self, user_id: int, channel_id: int):
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await self._end_voice_internal(cur, user_id)
                    await conn.commit()
            except Exception as e:
                logger.error(f"end_voice_session fehlgeschlagen: {e}")

    async def _end_voice_internal(self, cur, user_id: int):
        await cur.execute(
            'SELECT guild_id, channel_id, start_time FROM active_voice_sessions WHERE user_id = %s',
            (user_id,))
        session = await cur.fetchone()
        if not session:
            return
        guild_id, channel_id, start_time = session
        duration_minutes = min((datetime.now() - start_time).total_seconds() / 60, 1440)
        if duration_minutes > 0.5:
            await cur.execute('''
                INSERT INTO voice_sessions
                    (user_id, guild_id, channel_id, start_time, end_time, duration_minutes)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (user_id, guild_id, channel_id, start_time, datetime.now(), duration_minutes))

            today = datetime.now().date()
            await cur.execute('''
                INSERT INTO daily_stats (guild_id, date, voice_minutes) VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE voice_minutes = voice_minutes + %s
            ''', (guild_id, today, duration_minutes, duration_minutes))

            await self._update_global_xp(cur, user_id, guild_id, 'voice', duration_minutes)

        await cur.execute('DELETE FROM active_voice_sessions WHERE user_id = %s', (user_id,))

    # ------------------------------------------------------------------
    # XP  (unverändert, nur ensure_connection nicht nötig — läuft intern)
    # ------------------------------------------------------------------

    async def _update_global_xp(self, cur, user_id: int, guild_id: int,
                                 activity_type: str, value: float = 0):
        try:
            xp_gain = (1 + min(value * 0.1, 5)) if activity_type == 'message' else value * 0.5

            await cur.execute(
                'SELECT global_level, global_xp, total_messages, total_voice_minutes, '
                'last_daily_activity, daily_streak FROM global_user_levels WHERE user_id = %s',
                (user_id,))
            user_data = await cur.fetchone()
            today = datetime.now().date()

            if user_data:
                current_level, current_xp, total_msg, total_voice, last_daily, daily_streak = user_data
                if last_daily:
                    if today == last_daily + timedelta(days=1):
                        daily_streak += 1
                    elif today != last_daily:
                        daily_streak = 1
                else:
                    daily_streak = 1

                new_xp    = current_xp + xp_gain
                new_level = self._calculate_level(new_xp)
                if activity_type == 'message':
                    total_msg += 1
                else:
                    total_voice += value

                await cur.execute(
                    'SELECT COUNT(DISTINCT guild_id) FROM messages WHERE user_id = %s', (user_id,))
                server_count = (await cur.fetchone())[0] or 1

                await cur.execute('''
                    UPDATE global_user_levels
                    SET global_level = %s, global_xp = %s, total_messages = %s,
                        total_voice_minutes = %s, total_servers = %s,
                        last_activity = NOW(), last_daily_activity = %s,
                        daily_streak = %s, best_streak = GREATEST(best_streak, %s)
                    WHERE user_id = %s
                ''', (new_level, new_xp, total_msg, total_voice, server_count,
                      today, daily_streak, daily_streak, user_id))
            else:
                initial_level = self._calculate_level(xp_gain)
                await cur.execute('''
                    INSERT INTO global_user_levels
                        (user_id, global_level, global_xp, total_messages,
                         total_voice_minutes, total_servers, last_daily_activity,
                         daily_streak, best_streak)
                    VALUES (%s, %s, %s, %s, %s, 1, %s, 1, 1)
                ''', (user_id, initial_level, xp_gain,
                      1 if activity_type == 'message' else 0,
                      value if activity_type == 'voice' else 0, today))
        except Exception as e:
            logger.error(f"_update_global_xp fehlgeschlagen: {e}")

    def _calculate_level(self, xp: float) -> int:
        if xp < 50:
            return 1
        return int((xp / 50) ** (2 / 3)) + 1

    def _xp_for_level(self, level: int) -> int:
        if level <= 1:
            return 0
        return int(50 * ((level - 1) ** 1.5))

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_user_stats(self, user_id: int, hours: int = 24,
                             guild_id: Optional[int] = None) -> Tuple[int, float]:
        await self.ensure_connection()
        async with self.lock:
            try:
                cutoff = datetime.now() - timedelta(hours=hours)
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        if guild_id:
                            await cur.execute(
                                'SELECT COUNT(*) FROM messages '
                                'WHERE user_id=%s AND guild_id=%s AND timestamp>%s',
                                (user_id, guild_id, cutoff))
                        else:
                            await cur.execute(
                                'SELECT COUNT(*) FROM messages WHERE user_id=%s AND timestamp>%s',
                                (user_id, cutoff))
                        msg_count = (await cur.fetchone())[0] or 0

                        if guild_id:
                            await cur.execute(
                                'SELECT COALESCE(SUM(duration_minutes),0) FROM voice_sessions '
                                'WHERE user_id=%s AND guild_id=%s AND start_time>%s',
                                (user_id, guild_id, cutoff))
                        else:
                            await cur.execute(
                                'SELECT COALESCE(SUM(duration_minutes),0) FROM voice_sessions '
                                'WHERE user_id=%s AND start_time>%s', (user_id, cutoff))
                        voice_mins = (await cur.fetchone())[0] or 0
                return msg_count, voice_mins
            except Exception as e:
                logger.error(f"get_user_stats fehlgeschlagen: {e}")
                return 0, 0

    async def get_global_user_info(self, user_id: int) -> Optional[Dict]:
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute('''
                            SELECT global_level, global_xp, total_messages, total_voice_minutes,
                                   total_servers, daily_streak, best_streak,
                                   first_seen, achievements, is_private
                            FROM global_user_levels WHERE user_id = %s
                        ''', (user_id,))
                        result = await cur.fetchone()
                        if not result:
                            return None
                        level, xp, total_msg, total_voice, servers, streak, \
                            best_streak, first_seen, achievements, is_private = result

                        await cur.execute(
                            'SELECT COUNT(*) + 1 FROM global_user_levels WHERE global_xp > %s', (xp,))
                        rank = (await cur.fetchone())[0]

                        next_xp = self._xp_for_level(level + 1)
                        curr_xp = self._xp_for_level(level)
                        return {
                            'level': level, 'xp': xp,
                            'xp_progress': xp - curr_xp, 'xp_needed': next_xp - curr_xp,
                            'total_messages': total_msg, 'total_voice_minutes': total_voice,
                            'total_servers': servers, 'daily_streak': streak,
                            'best_streak': best_streak, 'first_seen': first_seen,
                            'achievements': json.loads(achievements) if achievements else [],
                            'is_private': is_private, 'rank': rank,
                        }
            except Exception as e:
                logger.error(f"get_global_user_info fehlgeschlagen: {e}")
                return None

    async def get_leaderboard(self, limit: int = 10, guild_id: Optional[int] = None,
                              bot=None) -> List[Tuple]:
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        if guild_id:
                            await cur.execute('''
                                SELECT user_id, COUNT(*) AS messages,
                                       COALESCE(SUM(word_count), 0) AS total_words
                                FROM messages
                                WHERE guild_id = %s
                                  AND timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
                                GROUP BY user_id ORDER BY messages DESC LIMIT %s
                            ''', (guild_id, limit))
                        else:
                            await cur.execute('''
                                SELECT user_id, global_level, global_xp,
                                       total_messages, total_voice_minutes, is_private
                                FROM global_user_levels
                                ORDER BY global_xp DESC LIMIT %s
                            ''', (limit,))
                        rows = await cur.fetchall()

                        if bot is None:
                            return rows

                        clean, orphans = [], []
                        for row in rows:
                            (orphans if bot.get_user(row[0]) is None else clean).append(row)
                        if orphans:
                            for uid in [r[0] for r in orphans]:
                                await self._hard_delete_user(cur, uid)
                            await conn.commit()
                        return clean
            except Exception as e:
                logger.error(f"get_leaderboard fehlgeschlagen: {e}")
                return []

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    async def monthly_season_reset(self):
        if datetime.now().day != 1:
            return
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        for table in ('messages', 'voice_sessions', 'daily_stats'):
                            await cur.execute(f'DELETE FROM {table}')
                        await cur.execute('''
                            UPDATE global_user_levels SET
                                global_level = 1, global_xp = 0, total_messages = 0,
                                total_voice_minutes = 0, total_servers = 0,
                                daily_streak = 0, best_streak = 0, last_daily_activity = NULL
                        ''')
                    await conn.commit()
                logger.info("Monatlicher Season-Reset abgeschlossen.")
            except Exception as e:
                logger.error(f"monthly_season_reset fehlgeschlagen: {e}")

    async def cleanup_old_data(self, days: int = 30):
        await self.ensure_connection()
        async with self.lock:
            try:
                cutoff = datetime.now() - timedelta(days=days)
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute('DELETE FROM messages WHERE timestamp < %s', (cutoff,))
                        await cur.execute('DELETE FROM voice_sessions WHERE start_time < %s', (cutoff,))
                        await cur.execute('DELETE FROM daily_stats WHERE date < %s', (cutoff.date(),))
                    await conn.commit()
                logger.info(f"Cleanup: Daten älter als {days} Tage entfernt.")
            except Exception as e:
                logger.error(f"cleanup_old_data fehlgeschlagen: {e}")

    async def delete_user_data(self, user_id: int) -> bool:
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await self._hard_delete_user(cur, user_id)
                    await conn.commit()
                return True
            except Exception as e:
                logger.error(f"delete_user_data fehlgeschlagen: {e}")
                return False

    async def _hard_delete_user(self, cur, user_id: int):
        for table, col in [
            ('messages',              'user_id'),
            ('voice_sessions',        'user_id'),
            ('active_voice_sessions', 'user_id'),
            ('global_user_levels',    'user_id'),
            ('user_achievements',     'user_id'),
        ]:
            await cur.execute(f'DELETE FROM {table} WHERE {col} = %s', (user_id,))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def get_daily_messages(self, guild_id: int, date: str) -> int:
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cur:
                        await cur.execute(
                            'SELECT messages_count FROM daily_stats WHERE guild_id=%s AND date=%s',
                            (guild_id, date))
                        row = await cur.fetchone()
                        return row[0] if row else 0
            except Exception as e:
                logger.error(f"get_daily_messages fehlgeschlagen: {e}")
                return 0

    async def get_weekly_stats(self, guild_id: int) -> list:
        await self.ensure_connection()
        async with self.lock:
            try:
                async with self.pool.acquire() as conn:
                    async with conn.cursor(aiomysql.DictCursor) as cur:
                        await cur.execute('''
                            SELECT date, messages_count AS messages FROM daily_stats
                            WHERE guild_id = %s AND date > DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                            ORDER BY date ASC
                        ''', (guild_id,))
                        return [dict(r) for r in await cur.fetchall()]
            except Exception as e:
                logger.error(f"get_weekly_stats fehlgeschlagen: {e}")
                return []

    def close(self):
        logger.info("StatsDB.close() aufgerufen (Pool wird über MariaConnector.close() geschlossen).")