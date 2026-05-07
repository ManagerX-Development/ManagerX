from .connector import MariaConnector
from typing import List, Dict, Any
import time

class BlacklistDatabase(MariaConnector):
    async def init_db(self):
        """Initialisiert die Blacklist-Tabelle."""
        query = """
        CREATE TABLE IF NOT EXISTS global_blacklist (
            user_id VARCHAR(25) PRIMARY KEY,
            reason TEXT,
            admin_id VARCHAR(25),
            admin_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_VALUE
        )
        """
        # Hinweis: CURRENT_TIMESTAMP wird automatisch gesetzt
        await self.execute_query("""
        CREATE TABLE IF NOT EXISTS global_blacklist (
            user_id VARCHAR(25) PRIMARY KEY,
            reason TEXT,
            admin_id VARCHAR(25),
            admin_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

    async def add_to_blacklist(self, user_id: str, reason: str, admin_id: str, admin_name: str) -> bool:
        query = "INSERT INTO global_blacklist (user_id, reason, admin_id, admin_name) VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE reason=%s"
        return await self.execute_query(query, (user_id, reason, admin_id, admin_name, reason))

    async def remove_from_blacklist(self, user_id: str) -> bool:
        query = "DELETE FROM global_blacklist WHERE user_id = %s"
        return await self.execute_query(query, (user_id,))

    async def is_blacklisted(self, user_id: str) -> Dict[str, Any]:
        query = "SELECT * FROM global_blacklist WHERE user_id = %s"
        result = await self.fetch_all(query, (user_id,))
        return result[0] if result else None

    async def get_all_blacklisted(self) -> List[Dict[str, Any]]:
        query = "SELECT * FROM global_blacklist ORDER BY created_at DESC"
        return await self.fetch_all(query)
