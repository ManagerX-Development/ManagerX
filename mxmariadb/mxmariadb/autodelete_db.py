# Copyright (c) 2026 OPPRO.NET Network
# MariaDB version of AutoDeleteDB - FULL ASYNC FIX
import aiomysql
import logging
import asyncio
from datetime import datetime
from typing import Optional, Dict, List
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)

class AutoDeleteDB(MariaConnector):
    """MariaDB-backed AutoDelete database. Vollständig asynchron und sicher gegen NoneType Errors."""

    def __init__(self):
        super().__init__()

    async def _ensure_pool(self):
        """Wartet geduldig, bis der Datenbank-Pool bereit ist, ohne zu crashen."""
        if self.pool is None:
            await self.connect()
            
        attempts = 0
        while self.pool is None and attempts < 15:
            await asyncio.sleep(0.5)
            attempts += 1
            
        if self.pool is None:
            logger.warning("MariaDB-Pool ist noch nicht bereit. Aktion wird übersprungen.")
            return False
        return True

    async def init_db(self):
        if not await self._ensure_pool(): return
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS autodelete (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        channel_id BIGINT NOT NULL UNIQUE,
                        duration INT NOT NULL,
                        exclude_pinned TINYINT(1) DEFAULT 1,
                        exclude_bots TINYINT(1) DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS autodelete_whitelist (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        channel_id BIGINT NOT NULL,
                        target_id BIGINT NOT NULL,
                        target_type VARCHAR(10) NOT NULL,
                        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY uq_channel_target (channel_id, target_id, target_type)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS autodelete_stats (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        channel_id BIGINT NOT NULL UNIQUE,
                        deleted_count INT DEFAULT 0,
                        error_count INT DEFAULT 0,
                        last_deletion DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
            await conn.commit()
        logger.info("MariaDB autodelete tables initialized")

    async def add_autodelete(self, channel_id: int, duration: int, exclude_pinned: bool = True, exclude_bots: bool = False):
        if not await self._ensure_pool(): return
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO autodelete (channel_id, duration, exclude_pinned, exclude_bots)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        duration = VALUES(duration),
                        exclude_pinned = VALUES(exclude_pinned),
                        exclude_bots = VALUES(exclude_bots)
                ''', (channel_id, duration, exclude_pinned, exclude_bots))
                await cur.execute('INSERT IGNORE INTO autodelete_stats (channel_id) VALUES (%s)', (channel_id,))
            await conn.commit()

    async def get_all(self) -> List[tuple]:
        if not await self._ensure_pool(): return []
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('SELECT channel_id, duration, exclude_pinned, exclude_bots FROM autodelete ORDER BY channel_id')
                results = await cur.fetchall()
                # Umwandlung von Dict (aus Connector) in Tuple (für Cog Kompatibilität)
                return [(r['channel_id'], r['duration'], r['exclude_pinned'], r['exclude_bots']) for r in results]

    async def get_autodelete_full(self, channel_id: int) -> Optional[tuple]:
        if not await self._ensure_pool(): return None
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('SELECT duration, exclude_pinned, exclude_bots FROM autodelete WHERE channel_id = %s', (channel_id,))
                r = await cur.fetchone()
                return (r['duration'], r['exclude_pinned'], r['exclude_bots']) if r else None

    async def update_stats(self, channel_id: int, deleted_count: int = 0, error_count: int = 0):
        if not await self._ensure_pool(): return
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                last_del = datetime.utcnow() if deleted_count > 0 else None
                await cur.execute('''
                    INSERT INTO autodelete_stats (channel_id, deleted_count, error_count, last_deletion)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        deleted_count = deleted_count + VALUES(deleted_count),
                        error_count = error_count + VALUES(error_count),
                        last_deletion = COALESCE(VALUES(last_deletion), last_deletion)
                ''', (channel_id, deleted_count, error_count, last_del))
            await conn.commit()