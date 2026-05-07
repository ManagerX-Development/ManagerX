# Copyright (c) 2025 OPPRO.NET Network
import aiomysql
import logging
from typing import List, Dict, Any, Optional
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)

class CMSDatabase(MariaConnector):
    """MariaDB class for the CMS (Dev Blog, Tutorials, Changelog, News, Announcements)."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Initialize CMS tables."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Main posts table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS cms_posts (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        post_type VARCHAR(20) NOT NULL DEFAULT 'dev',
                        title VARCHAR(255) NOT NULL,
                        slug VARCHAR(255) UNIQUE NOT NULL,
                        content LONGTEXT NOT NULL,
                        excerpt TEXT NULL,
                        cover_image VARCHAR(500) NULL,
                        author_id BIGINT NOT NULL,
                        author_name VARCHAR(100),
                        tags VARCHAR(500),
                        is_published BOOLEAN DEFAULT FALSE,
                        scheduled_at TIMESTAMP NULL DEFAULT NULL,
                        view_count INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX(post_type, is_published),
                        INDEX(slug)
                    )
                """)

                # Add new columns to existing table (safe migration)
                for col_def in [
                    "ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS excerpt TEXT NULL",
                    "ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) NULL",
                    "ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0",
                ]:
                    try:
                        await cur.execute(col_def)
                    except Exception:
                        pass  # Column already exists or unsupported syntax

                # Tags table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS cms_tags (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(50) UNIQUE NOT NULL,
                        slug VARCHAR(60) UNIQUE NOT NULL,
                        color VARCHAR(20) DEFAULT '#3498db',
                        emoji VARCHAR(10) DEFAULT ''
                    )
                """)

                # Media/uploads table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS cms_media (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        filename VARCHAR(255) NOT NULL UNIQUE,
                        original_name VARCHAR(255) NOT NULL,
                        mime_type VARCHAR(100) NOT NULL,
                        size_bytes INT NOT NULL,
                        uploader_id BIGINT NOT NULL,
                        uploader_name VARCHAR(100),
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX(uploader_id)
                    )
                """)

                # Revision history table
                await cur.execute("""
                    CREATE TABLE IF NOT EXISTS cms_revisions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        post_id INT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        content LONGTEXT NOT NULL,
                        excerpt TEXT NULL,
                        cover_image VARCHAR(500) NULL,
                        tags VARCHAR(500),
                        changed_by_id BIGINT NOT NULL,
                        changed_by_name VARCHAR(100),
                        change_note VARCHAR(255),
                        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (post_id) REFERENCES cms_posts(id) ON DELETE CASCADE,
                        INDEX(post_id)
                    )
                """)

            await conn.commit()
        logger.info("CMS tables initialized in MariaDB")

    # ─────────────────────────────────────────
    # POSTS
    # ─────────────────────────────────────────

    async def create_post(self, post_type: str, title: str, slug: str, content: str,
                          author_id: int, author_name: str, tags: str = "",
                          is_published: bool = False, scheduled_at: str = None,
                          excerpt: str = None, cover_image: str = None):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO cms_posts
                    (post_type, title, slug, content, excerpt, cover_image,
                     author_id, author_name, tags, is_published, scheduled_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (post_type, title, slug, content, excerpt, cover_image,
                      author_id, author_name, tags, is_published, scheduled_at))
            await conn.commit()
            return True

    async def get_posts(self, post_type: str = None, published_only: bool = True):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                query = "SELECT * FROM cms_posts"
                conditions = []
                params = []

                if post_type:
                    conditions.append("post_type = %s")
                    params.append(post_type)

                if published_only:
                    conditions.append("(is_published = TRUE AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP))")

                if conditions:
                    query += " WHERE " + " AND ".join(conditions)

                query += " ORDER BY created_at DESC"

                await cur.execute(query, tuple(params))
                return await cur.fetchall()

    async def get_post_by_slug(self, slug: str):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT * FROM cms_posts WHERE slug = %s", (slug,))
                return await cur.fetchone()

    async def get_post_by_id(self, post_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT * FROM cms_posts WHERE id = %s", (post_id,))
                return await cur.fetchone()

    async def increment_view_count(self, post_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("UPDATE cms_posts SET view_count = view_count + 1 WHERE id = %s", (post_id,))
            await conn.commit()

    async def update_post(self, post_id: int, **kwargs):
        if not kwargs:
            return False

        # Felder die nicht direkt gesetzt werden dürfen
        protected = {'id', 'created_at', 'updated_at'}
        kwargs = {k: v for k, v in kwargs.items() if k not in protected}

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                fields = []
                params = []
                for key, value in kwargs.items():
                    fields.append(f"{key} = %s")
                    params.append(value)

                params.append(post_id)
                query = f"UPDATE cms_posts SET {', '.join(fields)} WHERE id = %s"
                await cur.execute(query, tuple(params))
            await conn.commit()
            return True

    async def delete_post(self, post_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM cms_posts WHERE id = %s", (post_id,))
            await conn.commit()
            return True

    # ─────────────────────────────────────────
    # REVISIONS
    # ─────────────────────────────────────────

    async def save_revision(self, post_id: int, title: str, content: str,
                            tags: str, cover_image: str, excerpt: str,
                            changed_by_id: int, changed_by_name: str,
                            change_note: str = None):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO cms_revisions
                    (post_id, title, content, excerpt, cover_image, tags,
                     changed_by_id, changed_by_name, change_note)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (post_id, title, content, excerpt, cover_image, tags,
                      changed_by_id, changed_by_name, change_note))
            await conn.commit()

    async def get_revisions(self, post_id: int, limit: int = 20):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("""
                    SELECT id, post_id, title, changed_by_name, change_note, changed_at
                    FROM cms_revisions
                    WHERE post_id = %s
                    ORDER BY changed_at DESC
                    LIMIT %s
                """, (post_id, limit))
                return await cur.fetchall()

    async def get_revision_by_id(self, revision_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT * FROM cms_revisions WHERE id = %s", (revision_id,))
                return await cur.fetchone()

    # ─────────────────────────────────────────
    # MEDIA
    # ─────────────────────────────────────────

    async def create_media(self, filename: str, original_name: str, mime_type: str,
                           size_bytes: int, uploader_id: int, uploader_name: str):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO cms_media
                    (filename, original_name, mime_type, size_bytes, uploader_id, uploader_name)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (filename, original_name, mime_type, size_bytes, uploader_id, uploader_name))
            await conn.commit()
            return True

    async def get_media(self, limit: int = 100):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("""
                    SELECT * FROM cms_media ORDER BY uploaded_at DESC LIMIT %s
                """, (limit,))
                return await cur.fetchall()

    async def delete_media(self, media_id: int):
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT filename FROM cms_media WHERE id = %s", (media_id,))
                row = await cur.fetchone()
            async with conn.cursor() as cur:
                await cur.execute("DELETE FROM cms_media WHERE id = %s", (media_id,))
            await conn.commit()
            return row["filename"] if row else None

    # ─────────────────────────────────────────
    # CHANGELOG
    # ─────────────────────────────────────────

    async def get_changelog(self, limit: int = 50):
        """Get published changelog entries, sorted by date."""
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("""
                    SELECT id, title, slug, excerpt, content, tags, author_name,
                           cover_image, created_at, updated_at
                    FROM cms_posts
                    WHERE post_type = 'changelog'
                      AND is_published = TRUE
                      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))
                return await cur.fetchall()

    # ─────────────────────────────────────────
    # TAGS
    # ─────────────────────────────────────────

    async def get_tags(self) -> List[Dict[str, Any]]:
        await self.ensure_connection()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT * FROM cms_tags ORDER BY name")
                    return await cur.fetchall()
        except Exception as e:
            logger.error(f"Error fetching tags: {e}")
            return []

    async def create_tag(self, name: str, slug: str, color: str = "#3498db", emoji: str = ""):
        await self.ensure_connection()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "INSERT INTO cms_tags (name, slug, color, emoji) VALUES (%s, %s, %s, %s)",
                        (name, slug, color, emoji)
                    )
                    await conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error creating tag: {e}")
            return False

    async def update_tag(self, tag_id: int, **kwargs):
        await self.ensure_connection()
        if not kwargs: return False
        
        fields = []
        values = []
        for k, v in kwargs.items():
            fields.append(f"{k} = %s")
            values.append(v)
        
        values.append(tag_id)
        query = f"UPDATE cms_tags SET {', '.join(fields)} WHERE id = %s"
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(query, tuple(values))
                    await conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error updating tag: {e}")
            return False

    async def delete_tag(self, tag_id: int):
        await self.ensure_connection()
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM cms_tags WHERE id = %s", (tag_id,))
                    await conn.commit()
                    return True
        except Exception as e:
            logger.error(f"Error deleting tag: {e}")
            return False
