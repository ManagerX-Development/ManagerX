# Copyright (c) 2025 OPPRO.NET Network
import os
import aiomysql
import asyncio
import logging
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / 'config' / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)


class MariaConnector:
    _pool = None
    _lock = asyncio.Lock()
    _initialized: set = set()

    def __init__(self):
        self.host = os.getenv("DB_HOST", "127.0.0.1")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.database = os.getenv("DB_NAME")
        self.port = int(os.getenv("DB_PORT", 3306))

    @property
    def pool(self):
        return MariaConnector._pool

    async def connect(self):
        async with MariaConnector._lock:
            if MariaConnector._pool is None:
                if not self.user or not self.database:
                    logger.error(f"DB-Credentials fehlen in {env_path}")
                    raise RuntimeError("Datenbankzugangsdaten fehlen.")

                try:
                    logger.info(f"[DB] Verbinde zu {self.host}:{self.port} DB='{self.database}' als '{self.user}'...")
                    MariaConnector._pool = await aiomysql.create_pool(
                        host=self.host,
                        user=self.user,
                        password=self.password,
                        db=self.database,
                        port=self.port,
                        autocommit=False,
                        minsize=2,
                        maxsize=15,
                        echo=False,
                        pool_recycle=1800,        # Connections nach 30 Min recyclen
                        connect_timeout=10,       # Verbindungs-Timeout
                    )
                    logger.info("✅ MariaDB Pool erstellt.")
                except Exception as e:
                    logger.critical(f"❌ Pool-Erstellung fehlgeschlagen: {e}")
                    raise

        cls_name = type(self).__name__
        if cls_name not in MariaConnector._initialized:
            MariaConnector._initialized.add(cls_name)
            try:
                await self.init_db()
                logger.info(f"[{cls_name}] init_db() erfolgreich.")
            except Exception as e:
                MariaConnector._initialized.discard(cls_name)
                logger.critical(f"[{cls_name}] init_db() fehlgeschlagen: {e}")
                raise

    async def init_db(self):
        pass

    async def ensure_connection(self):
        async with MariaConnector._lock:
            if MariaConnector._pool is None or type(self).__name__ not in MariaConnector._initialized:
                await self.connect()

    async def close(self):
        async with MariaConnector._lock:
            if MariaConnector._pool:
                MariaConnector._pool.close()
                await MariaConnector._pool.wait_closed()
                MariaConnector._pool = None
                MariaConnector._initialized.clear()
                logger.info("MariaDB Pool geschlossen.")