# Copyright (c) 2026 OPPRO.NET Network
# MariaDB version of EconomyDatabase
import aiomysql
import logging
from typing import Optional, List, Dict, Tuple
from mxmariadb.connector import MariaConnector

logger = logging.getLogger(__name__)


class EconomyDatabase(MariaConnector):
    """MariaDB-backed economy database. Same API as the aiosqlite version."""

    def __init__(self):
        super().__init__()

    async def init_db(self):
        """Create all required tables and seed shop."""
        await self.create_tables()
        await self._seed_shop()

    async def create_tables(self):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS global_economy (
                            user_id BIGINT PRIMARY KEY,
                            coins BIGINT DEFAULT 0,
                            total_earned BIGINT DEFAULT 0,
                            last_daily DATETIME,
                            last_message_at DATETIME
                        )
                    """)
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS guild_economy (
                            guild_id BIGINT,
                            user_id BIGINT,
                            coins BIGINT DEFAULT 0,
                            total_earned BIGINT DEFAULT 0,
                            PRIMARY KEY (guild_id, user_id)
                        )
                    """)
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS shop_items (
                            item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            description TEXT,
                            price BIGINT NOT NULL,
                            type VARCHAR(50) NOT NULL,
                            value VARCHAR(255) NOT NULL,
                            is_active TINYINT(1) DEFAULT 1
                        )
                    """)
                    await cur.execute("""
                        CREATE TABLE IF NOT EXISTS user_inventory (
                            user_id BIGINT,
                            item_id BIGINT,
                            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            is_equipped TINYINT(1) DEFAULT 0,
                            PRIMARY KEY (user_id, item_id)
                        )
                    """)
                await conn.commit()
            logger.info("MariaDB economy tables created")
        except Exception as e:
            logger.error(f"Error creating economy tables: {e}")
            raise

    async def _seed_shop(self):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT COUNT(*) FROM shop_items")
                    count = (await cur.fetchone())[0]
                    if count == 0:
                        items = [
                            ('Rot (Name)', 'Verändert die Farbe deines Namens im GlobalChat zu Rot.', 500, 'color', '#FF0000'),
                            ('Blau (Name)', 'Verändert die Farbe deines Namens im GlobalChat zu Blau.', 500, 'color', '#3498DB'),
                            ('Grün (Name)', 'Verändert die Farbe deines Namens im GlobalChat zu Grün.', 500, 'color', '#2ECC71'),
                            ('Gold (Name)', 'Premium-Farbe für deinen Namen.', 2000, 'color', '#F1C40F'),
                            ('🔥 Feuer-Emoji', 'Fügt ein Feuer-Emoji neben deinen Namen.', 300, 'emoji', '🔥'),
                            ('👑 Kronen-Emoji', 'Fügt eine Krone neben deinen Namen.', 1000, 'emoji', '👑'),
                            ('⚡ Blitz-Emoji', 'Fügt einen Blitz neben deinen Namen.', 300, 'emoji', '⚡')
                        ]
                        await cur.executemany(
                            "INSERT INTO shop_items (name, description, price, type, value) VALUES (%s, %s, %s, %s, %s)",
                            items)
                await conn.commit()
                logger.info("Shop seeded")
        except Exception as e:
            logger.error(f"Error seeding shop: {e}")

    # --- Global Economy ---

    async def get_global_balance(self, user_id: int) -> int:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT coins FROM global_economy WHERE user_id = %s", (user_id,))
                    result = await cur.fetchone()
                    return result[0] if result else 0
        except Exception:
            return 0

    async def add_global_coins(self, user_id: int, amount: int):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO global_economy (user_id, coins, total_earned)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            coins = coins + %s,
                            total_earned = total_earned + %s
                    """, (user_id, amount, amount, amount, amount))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error adding global coins: {e}")

    async def claim_daily(self, user_id: int, amount: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO global_economy (user_id, coins, last_daily)
                        VALUES (%s, %s, NOW())
                        ON DUPLICATE KEY UPDATE
                            coins = coins + %s,
                            last_daily = NOW()
                    """, (user_id, amount, amount))
                await conn.commit()
            return True
        except Exception:
            return False

    async def update_last_message(self, user_id: int):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO global_economy (user_id, last_message_at)
                        VALUES (%s, NOW())
                        ON DUPLICATE KEY UPDATE last_message_at = NOW()
                    """, (user_id,))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error updating last message: {e}")

    async def get_user_economy_info(self, user_id: int) -> Dict:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT * FROM global_economy WHERE user_id = %s", (user_id,))
                    result = await cur.fetchone()
                    return dict(result) if result else {}
        except Exception:
            return {}

    # --- Guild Economy ---

    async def get_guild_balance(self, guild_id: int, user_id: int) -> int:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "SELECT coins FROM guild_economy WHERE guild_id = %s AND user_id = %s",
                        (guild_id, user_id))
                    result = await cur.fetchone()
                    return result[0] if result else 0
        except Exception:
            return 0

    async def add_guild_coins(self, guild_id: int, user_id: int, amount: int):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        INSERT INTO guild_economy (guild_id, user_id, coins, total_earned)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            coins = coins + %s,
                            total_earned = total_earned + %s
                    """, (guild_id, user_id, amount, amount, amount, amount))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error adding guild coins: {e}")

    # --- Shop & Inventory ---

    async def get_shop_items(self) -> List[Dict]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT * FROM shop_items WHERE is_active = 1")
                    return await cur.fetchall()
        except Exception:
            return []

    async def get_item(self, item_id: int) -> Optional[Dict]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("SELECT * FROM shop_items WHERE item_id = %s", (item_id,))
                    return await cur.fetchone()
        except Exception:
            return None

    async def buy_item(self, user_id: int, item_id: int) -> Tuple[bool, str]:
        item = await self.get_item(item_id)
        if not item:
            return False, "Item existiert nicht."

        balance = await self.get_global_balance(user_id)
        if balance < item['price']:
            return False, f"Nicht genug Coins. Du brauchst {item['price']} Coins."

        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "UPDATE global_economy SET coins = coins - %s WHERE user_id = %s",
                        (item['price'], user_id))
                    await cur.execute(
                        "INSERT IGNORE INTO user_inventory (user_id, item_id) VALUES (%s, %s)",
                        (user_id, item_id))
                await conn.commit()
            return True, f"Du hast '{item['name']}' erfolgreich gekauft!"
        except Exception as e:
            logger.error(f"Error buying item: {e}")
            return False, "Ein Datenbankfehler ist aufgetreten."

    async def get_user_inventory(self, user_id: int) -> List[Dict]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("""
                        SELECT si.*, ui.purchased_at, ui.is_equipped
                        FROM shop_items si
                        JOIN user_inventory ui ON si.item_id = ui.item_id
                        WHERE ui.user_id = %s
                    """, (user_id,))
                    return await cur.fetchall()
        except Exception:
            return []

    async def equip_item(self, user_id: int, item_id: int) -> bool:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT type FROM shop_items WHERE item_id = %s", (item_id,))
                    item = await cur.fetchone()
                    if not item:
                        return False
                    item_type = item[0]

                    # Unequip same type
                    await cur.execute("""
                        UPDATE user_inventory SET is_equipped = 0
                        WHERE user_id = %s AND item_id IN
                            (SELECT item_id FROM shop_items WHERE type = %s)
                    """, (user_id, item_type))

                    await cur.execute(
                        "UPDATE user_inventory SET is_equipped = 1 WHERE user_id = %s AND item_id = %s",
                        (user_id, item_id))
                await conn.commit()
            return True
        except Exception:
            return False

    async def get_equipped_overrides(self, user_id: int) -> Dict[str, str]:
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute("""
                        SELECT si.type, si.value
                        FROM shop_items si
                        JOIN user_inventory ui ON si.item_id = ui.item_id
                        WHERE ui.user_id = %s AND ui.is_equipped = 1
                    """, (user_id,))
                    rows = await cur.fetchall()
                    return {r['type']: r['value'] for r in rows}
        except Exception:
            return {}

    async def delete_user_data(self, user_id: int):
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("DELETE FROM global_economy WHERE user_id = %s", (user_id,))
                    await cur.execute("DELETE FROM guild_economy WHERE user_id = %s", (user_id,))
                    await cur.execute("DELETE FROM user_inventory WHERE user_id = %s", (user_id,))
                await conn.commit()
        except Exception as e:
            logger.error(f"Error deleting user economy data: {e}")
