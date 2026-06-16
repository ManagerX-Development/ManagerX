from fastapi import APIRouter
from .auth_routes import router as auth_router
from .settings_routes import router as settings_router
from .user_routes import router as user_router
from .management_routes import router as management_router
from .cms import router as cms_router
from .guild_routes import router as guild_router

# Global Bot-Referenz (wird später in main.py gesetzt)
bot_instance = None

def set_bot_instance(bot):
    """Setzt die globale Bot-Instanz für die API."""
    global bot_instance
    bot_instance = bot

dashboard_main_router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

# Include all thematic sub-routers
dashboard_main_router.include_router(auth_router)
dashboard_main_router.include_router(settings_router)
dashboard_main_router.include_router(user_router)
dashboard_main_router.include_router(management_router)
dashboard_main_router.include_router(cms_router)
dashboard_main_router.include_router(guild_router)
