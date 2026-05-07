import asyncio
import sys
import os

# Pfad hinzufügen, damit mxmariadb gefunden wird
sys.path.append(os.getcwd())

from mxmariadb import CMSDatabase

async def update():
    db = CMSDatabase()
    try:
        await db.ensure_connection()
        async with db.pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Prüfen ob Spalte existiert (MariaDB 10.5+ unterstützt ADD COLUMN IF NOT EXISTS)
                try:
                    await cur.execute("ALTER TABLE cms_posts ADD COLUMN scheduled_at TIMESTAMP NULL DEFAULT NULL AFTER is_published")
                    print("Spalte 'scheduled_at' hinzugefügt.")
                except Exception as e:
                    if "Duplicate column name" in str(e):
                        print("Spalte existiert bereits.")
                    else:
                        print(f"Fehler beim Hinzufügen: {e}")
            await conn.commit()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(update())
