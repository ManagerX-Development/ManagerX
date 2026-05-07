import asyncio
import sys
import os
sys.path.append(os.getcwd())
from mxmariadb import CMSDatabase

async def check():
    db = CMSDatabase()
    await db.ensure_connection()
    async with db.pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DESCRIBE cms_posts")
            cols = await cur.fetchall()
            for col in cols:
                print(col)
    await db.close()

if __name__ == "__main__":
    asyncio.run(check())
