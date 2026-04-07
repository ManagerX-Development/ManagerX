# Copyright (c) 2025 OPPRO.NET Network
# MariaDB version of ProfileDB
import aiomysql
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class ProfileDB(MariaConnector):
    """MariaDB-backed profile database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create all required tables."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS profiles (
                        user_id BIGINT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        bio TEXT DEFAULT '',
                        color VARCHAR(10) DEFAULT '#5865F2',
                        banner TEXT,
                        theme VARCHAR(50) DEFAULT 'default',
                        privacy VARCHAR(20) DEFAULT 'public',
                        language VARCHAR(10) DEFAULT 'de',
                        level INT DEFAULT 1,
                        xp BIGINT DEFAULT 0,
                        xp_needed BIGINT DEFAULT 100,
                        created_at VARCHAR(50) NOT NULL,
                        updated_at VARCHAR(50) NOT NULL
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS profile_links (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        url TEXT NOT NULL,
                        emoji VARCHAR(10) DEFAULT '🔗',
                        position INT DEFAULT 0,
                        INDEX idx_user (user_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS achievements_profile (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        icon VARCHAR(10),
                        unlocked_at VARCHAR(50) NOT NULL,
                        INDEX idx_user (user_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS marketplace (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        tags TEXT,
                        author_id BIGINT NOT NULL,
                        author_name VARCHAR(255) NOT NULL,
                        profile_data TEXT NOT NULL,
                        downloads BIGINT DEFAULT 0,
                        rating DOUBLE DEFAULT 0.0,
                        created_at VARCHAR(50) NOT NULL
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS marketplace_downloads (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        marketplace_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        downloaded_at VARCHAR(50) NOT NULL,
                        INDEX idx_marketplace (marketplace_id)
                    )
                ''')
                await cur.execute('''
                    CREATE TABLE IF NOT EXISTS marketplace_ratings (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        marketplace_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        rating INT NOT NULL,
                        rated_at VARCHAR(50) NOT NULL,
                        UNIQUE KEY uq_rate (marketplace_id, user_id)
                    )
                ''')
            await conn.commit()
        logger.info("MariaDB profile tables initialized")

    # ===== PROFILE =====

    async def get_profile(self, user_id: int) -> Optional[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute('SELECT * FROM profiles WHERE user_id = %s', (user_id,))
                profile = await cur.fetchone()
                if not profile:
                    return None
                profile = dict(profile)

                await cur.execute(
                    'SELECT name, url, emoji FROM profile_links WHERE user_id = %s ORDER BY position',
                    (user_id,))
                profile['links'] = [dict(r) for r in await cur.fetchall()]

                await cur.execute(
                    'SELECT name, description, icon, unlocked_at FROM achievements_profile '
                    'WHERE user_id = %s ORDER BY unlocked_at DESC', (user_id,))
                profile['achievements'] = [dict(r) for r in await cur.fetchall()]

                return profile

    async def create_profile(self, user_id: int, username: str) -> Dict:
        now = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'INSERT INTO profiles (user_id, username, created_at, updated_at) VALUES (%s, %s, %s, %s)',
                    (user_id, username, now, now))
            await conn.commit()
        return await self.get_profile(user_id)

    async def update_profile_setting(self, user_id: int, key: str, value: Any) -> bool:
        allowed = ['bio', 'color', 'banner', 'theme', 'privacy', 'language',
                    'level', 'xp', 'xp_needed', 'username']
        if key not in allowed:
            return False
        now = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f'UPDATE profiles SET {key} = %s, updated_at = %s WHERE user_id = %s',
                    (value, now, user_id))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    async def delete_profile(self, user_id: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('DELETE FROM profile_links WHERE user_id = %s', (user_id,))
                await cur.execute('DELETE FROM achievements_profile WHERE user_id = %s', (user_id,))
                await cur.execute('DELETE FROM profiles WHERE user_id = %s', (user_id,))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    # ===== LINKS =====

    async def add_profile_link(self, user_id: int, link_data: Dict) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT COUNT(*) FROM profile_links WHERE user_id = %s', (user_id,))
                count = (await cur.fetchone())[0]
                if count >= 5:
                    return False
                await cur.execute(
                    'INSERT INTO profile_links (user_id, name, url, emoji, position) VALUES (%s, %s, %s, %s, %s)',
                    (user_id, link_data['name'], link_data['url'], link_data.get('emoji', '🔗'), count))
            await conn.commit()
        return True

    async def delete_profile_link(self, user_id: int, link_index: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT id FROM profile_links WHERE user_id = %s ORDER BY position LIMIT 1 OFFSET %s',
                    (user_id, link_index))
                row = await cur.fetchone()
                if not row:
                    return False
                await cur.execute('DELETE FROM profile_links WHERE id = %s', (row[0],))
            await conn.commit()
        return True

    async def get_profile_links(self, user_id: int) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT name, url, emoji FROM profile_links WHERE user_id = %s ORDER BY position',
                    (user_id,))
                return [dict(r) for r in await cur.fetchall()]

    # ===== ACHIEVEMENTS =====

    async def add_achievement(self, user_id: int, name: str, description: str = "", icon: str = "🏆") -> bool:
        now = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'INSERT INTO achievements_profile (user_id, name, description, icon, unlocked_at) '
                    'VALUES (%s, %s, %s, %s, %s)',
                    (user_id, name, description, icon, now))
            await conn.commit()
        return True

    async def get_achievements(self, user_id: int) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT name, description, icon, unlocked_at FROM achievements_profile '
                    'WHERE user_id = %s ORDER BY unlocked_at DESC', (user_id,))
                return [dict(r) for r in await cur.fetchall()]

    # ===== MARKETPLACE =====

    async def add_to_marketplace(self, marketplace_data: Dict) -> int:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'INSERT INTO marketplace (name, description, tags, author_id, author_name, profile_data, created_at) '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                    (marketplace_data['name'], marketplace_data['description'],
                     json.dumps(marketplace_data['tags']), marketplace_data['author_id'],
                     marketplace_data['author_name'], json.dumps(marketplace_data['profile_data']),
                     marketplace_data['created_at']))
                last_id = cur.lastrowid
            await conn.commit()
        return last_id

    async def get_marketplace_profiles(self, search: Optional[str] = None) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                if search:
                    s = f'%{search}%'
                    await cur.execute(
                        'SELECT id, name, description, tags, author_id, author_name, downloads, rating, created_at '
                        'FROM marketplace WHERE name LIKE %s OR description LIKE %s OR tags LIKE %s '
                        'ORDER BY downloads DESC, rating DESC', (s, s, s))
                else:
                    await cur.execute(
                        'SELECT id, name, description, tags, author_id, author_name, downloads, rating, created_at '
                        'FROM marketplace ORDER BY downloads DESC, rating DESC')
                profiles = []
                for row in await cur.fetchall():
                    p = dict(row)
                    p['tags'] = json.loads(p['tags'])
                    profiles.append(p)
                return profiles

    async def get_marketplace_profile(self, profile_id: int) -> Optional[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute('SELECT * FROM marketplace WHERE id = %s', (profile_id,))
                row = await cur.fetchone()
                if not row:
                    return None
                p = dict(row)
                p['tags'] = json.loads(p['tags'])
                p['profile_data'] = json.loads(p['profile_data'])
                return p

    async def download_marketplace_profile(self, marketplace_id: int, user_id: int) -> bool:
        now = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'SELECT id FROM marketplace_downloads WHERE marketplace_id = %s AND user_id = %s',
                    (marketplace_id, user_id))
                if await cur.fetchone():
                    return False
                await cur.execute(
                    'INSERT INTO marketplace_downloads (marketplace_id, user_id, downloaded_at) VALUES (%s, %s, %s)',
                    (marketplace_id, user_id, now))
                await cur.execute(
                    'UPDATE marketplace SET downloads = downloads + 1 WHERE id = %s', (marketplace_id,))
            await conn.commit()
        return True

    async def rate_marketplace_profile(self, marketplace_id: int, user_id: int, rating: int) -> bool:
        if not 1 <= rating <= 5:
            return False
        now = datetime.now().isoformat()
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('''
                    INSERT INTO marketplace_ratings (marketplace_id, user_id, rating, rated_at)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE rating = VALUES(rating), rated_at = VALUES(rated_at)
                ''', (marketplace_id, user_id, rating, now))
                await cur.execute(
                    'SELECT AVG(rating) FROM marketplace_ratings WHERE marketplace_id = %s',
                    (marketplace_id,))
                avg = (await cur.fetchone())[0]
                await cur.execute(
                    'UPDATE marketplace SET rating = %s WHERE id = %s', (round(avg, 1), marketplace_id))
            await conn.commit()
        return True

    async def get_user_uploads(self, user_id: int) -> List[Dict]:
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(
                    'SELECT id, name, description, downloads, rating, created_at '
                    'FROM marketplace WHERE author_id = %s ORDER BY created_at DESC', (user_id,))
                return [dict(r) for r in await cur.fetchall()]

    async def delete_marketplace_profile(self, profile_id: int, user_id: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'DELETE FROM marketplace WHERE id = %s AND author_id = %s',
                    (profile_id, user_id))
                success = cur.rowcount > 0
            await conn.commit()
        return success

    # ===== XP =====

    async def add_xp(self, user_id: int, amount: int) -> Optional[Dict]:
        profile = await self.get_profile(user_id)
        if not profile:
            return None
        new_xp = profile['xp'] + amount
        new_level = profile['level']
        xp_needed = profile['xp_needed']
        while new_xp >= xp_needed:
            new_xp -= xp_needed
            new_level += 1
            xp_needed = int(xp_needed * 1.5)

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    'UPDATE profiles SET xp = %s, level = %s, xp_needed = %s, updated_at = %s WHERE user_id = %s',
                    (new_xp, new_level, xp_needed, datetime.now().isoformat(), user_id))
            await conn.commit()
        return {'level': new_level, 'xp': new_xp, 'xp_needed': xp_needed,
                'leveled_up': new_level > profile['level']}

    # ===== STATS =====

    async def get_stats(self) -> Dict:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute('SELECT COUNT(*) FROM profiles')
                total_profiles = (await cur.fetchone())[0]
                await cur.execute('SELECT COUNT(*) FROM marketplace')
                total_marketplace = (await cur.fetchone())[0]
                await cur.execute('SELECT COALESCE(SUM(downloads), 0) FROM marketplace')
                total_downloads = (await cur.fetchone())[0]
        return {'total_profiles': total_profiles, 'total_marketplace': total_marketplace,
                'total_downloads': total_downloads}

    # ===== MAINTENANCE =====

    async def delete_user_data(self, user_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute('DELETE FROM profile_links WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM achievements_profile WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM profiles WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM marketplace WHERE author_id = %s', (user_id,))
                    await cur.execute('DELETE FROM marketplace_downloads WHERE user_id = %s', (user_id,))
                    await cur.execute('DELETE FROM marketplace_ratings WHERE user_id = %s', (user_id,))
                await conn.commit()
            return True
        except Exception:
            return False

    def close(self):
        pass
