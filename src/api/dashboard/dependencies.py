from fastapi import HTTPException, Depends, Request
import jwt
import os

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")
ALGORITHM = "HS256"

def get_bot():
    """Dependency to get the global bot instance."""
    from src.api.dashboard.routes import bot_instance
    if not bot_instance:
        raise HTTPException(status_code=503, detail="Bot not ready")
    return bot_instance

def get_current_user(request: Request):
    """Dependency to get the current user from the access_token cookie or Authorization header."""
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization header for backward compatibility
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "username": payload.get("username", ""), "avatar": payload.get("avatar", "")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Database Dependencies
def get_welcome_db():
    from mxmariadb import WelcomeDatabase
    db = WelcomeDatabase()
    return db

def get_antispam_db():
    from mxmariadb import AntiSpamDatabase
    db = AntiSpamDatabase()
    return db

def get_globalchat_db():
    from mxmariadb import GlobalChatDatabase
    db = GlobalChatDatabase()
    return db

def get_level_db():
    from mxmariadb import LevelDatabase
    db = LevelDatabase()
    return db

def get_logging_db():
    from mxmariadb import LoggingDatabase
    db = LoggingDatabase()
    return db

def get_autorole_db():
    from mxmariadb import AutoRoleDatabase
    db = AutoRoleDatabase()
    return db

def get_autodelete_db():
    from mxmariadb import AutoDeleteDB
    db = AutoDeleteDB()
    return db

def get_tempvc_db():
    from mxmariadb import TempVCDatabase
    db = TempVCDatabase()
    return db
