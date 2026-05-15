from fastapi import Request, HTTPException, Depends
from src.api.dashboard.auth_routes import get_current_user
from mxmariadb import CMSDatabase
from src.bot.core.config import BotConfig
import re
from pathlib import Path

# Upload-Verzeichnis
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "public" / "uploads" / "cms"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/svg+xml", "video/mp4", "application/pdf"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def slugify(text: str) -> str:
    """Simple slugify function."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

async def get_maybe_user(request: Request):
    """Optional JWT user – returns None if unauthenticated."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        return get_current_user(request)
    except Exception:
        return None

def is_admin(request: Request, user: dict = None) -> bool:
    """Check if the requester is a bot owner or CMS admin."""
    bypass_enabled = getattr(BotConfig.api, 'localhost_bypass', False)
    client_ip = request.client.host

    if bypass_enabled and client_ip in ["127.0.0.1", "localhost"]:
        x_user_id = request.headers.get("X-User-ID")
        if x_user_id:
            if x_user_id == "cms_admin":
                return True
            try:
                user_id = int(x_user_id)
                owners = getattr(BotConfig.security, 'bot_owners', [])
                if user_id in owners:
                    return True
            except (ValueError, TypeError):
                pass

    if not user:
        return False

    uid = user["id"]
    if uid == "cms_admin":
        return True

    try:
        user_id = int(uid)
        owners = getattr(BotConfig.security, 'bot_owners', [])
        return user_id in owners
    except (ValueError, TypeError):
        return False

def get_requester_info(request: Request, user: dict) -> tuple[int, str]:
    """Returns (user_id, username) from JWT or fallback header."""
    if user:
        try:
            return int(user["id"]), user.get("username", "Unknown")
        except (ValueError, TypeError):
            return 0, user.get("username", "Unknown")
    
    x_user_id = request.headers.get("X-User-ID")
    try:
        return int(x_user_id) if x_user_id else 0, "Admin"
    except (ValueError, TypeError):
        return 0, "Admin"

async def get_cms_db() -> CMSDatabase:
    db = CMSDatabase()
    await db.ensure_connection()
    return db
