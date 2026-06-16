from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import RedirectResponse
import httpx
import jwt
import os
import time
from urllib.parse import urlencode

from .schemas import EmailLoginRequest, CallbackRequest
from .dependencies import get_current_user, get_bot, JWT_SECRET, ALGORITHM

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# JWT Setup
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

# Discord OAuth Setup
CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:8080/dash/auth/callback")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:8080")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

@router.get("/login")
async def login():
    """Generates the Discord OAuth2 Authorization URL and redirects the user."""
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "identify guilds",
        "prompt": "consent"
    }
    url = f"https://discord.com/oauth2/authorize?{urlencode(params)}"
    print(f"[DEBUG] Generated Discord URL: {url}")
    return {"url": url}

# Brute Force Protection
login_attempts = {} # {ip: {"count": 0, "last_attempt": 0}}

@router.post("/login/email")
async def login_email(request: Request, data: EmailLoginRequest, response: Response):
    """CMS Admin Login using Email and Password with Brute Force protection."""
    client_ip = request.client.host
    now = time.time()

    # 1. Check Rate Limit
    if client_ip in login_attempts:
        attempt_data = login_attempts[client_ip]
        if attempt_data["count"] >= 5 and (now - attempt_data["last_attempt"]) < 900:
            wait_time = int(900 - (now - attempt_data["last_attempt"]))
            raise HTTPException(
                status_code=429, 
                detail=f"Zu viele Fehlversuche. Bitte warte {wait_time // 60} Minuten."
            )
        if (now - attempt_data["last_attempt"]) > 900:
            login_attempts[client_ip] = {"count": 0, "last_attempt": now}

    admin_email = os.getenv("CMS_ADMIN_EMAIL")
    admin_pass = os.getenv("CMS_ADMIN_PASSWORD")

    if data.email == admin_email and data.password == admin_pass:
        if client_ip in login_attempts:
            del login_attempts[client_ip]

        jwt_token = create_access_token({
            "sub": "cms_admin",
            "username": "Lenny (CMS Admin)",
            "avatar": "https://cdn.discordapp.com/embed/avatars/0.png"
        })

        try:
            bot = get_bot()
            from src.bot.core.config import BotConfig
            owners = getattr(BotConfig.security, 'bot_owners', [])
            
            if bot:
                alert_msg = (
                    "âš ï¸ **Sicherheits-Alarm: Admin-Login** âš ï¸\n\n"
                    f"Ein Login in die Admin-Zentrale wurde soeben durchgefÃ¼hrt.\n"
                    f"**E-Mail:** `{data.email}`\n"
                    f"**IP-Adresse:** `{client_ip}`\n"
                    f"**Zeitpunkt:** <t:{int(now)}:F>\n\n"
                    "Falls du das nicht warst, Ã¤ndere sofort dein Passwort in der `.env`!"
                )
                for owner_id in owners:
                    owner = bot.get_user(int(owner_id))
                    if owner:
                        await owner.send(alert_msg)
        except Exception as e:
            print(f"[ERROR] Failed to send security alert: {e}")

        secure = request.url.scheme == "https"
        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            samesite="lax",
            secure=secure,
            max_age=60 * 24 * 7 * 60,
            path="/"
        )

        return {
            "access_token": jwt_token,
            "user": {
                "id": "cms_admin",
                "username": "Lenny (CMS Admin)",
                "avatar": "https://cdn.discordapp.com/embed/avatars/0.png",
                "isAdmin": True
            }
        }
    
    if client_ip not in login_attempts:
        login_attempts[client_ip] = {"count": 0, "last_attempt": now}
    
    login_attempts[client_ip]["count"] += 1
    login_attempts[client_ip]["last_attempt"] = now
    
    time.sleep(1.5)
    raise HTTPException(status_code=401, detail="UngÃ¼ltige E-Mail oder Passwort")

@router.post("/callback")
async def callback(data: CallbackRequest, request: Request, response: Response):
    """Exchanges code for a token and creates a JWT session."""
    code = data.code
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
        
    async with httpx.AsyncClient() as client:
        token_data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        try:
            token_res = await client.post("https://discord.com/api/oauth2/token", data=token_data, headers=headers)
            token_res.raise_for_status()
            token_json = token_res.json()
            access_token = token_json.get("access_token")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to exchange token: {e}")
            
        user_res = await client.get("https://discord.com/api/users/@me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        user_json = user_res.json()
        user_id = user_json.get("id")
        
        jwt_token = create_access_token({
            "sub": user_id,
            "username": user_json.get("username"),
            "avatar": user_json.get("avatar")
        })
        
        secure = request.url.scheme == "https"
        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            samesite="lax",
            secure=secure,
            max_age=60 * 24 * 7 * 60,
            path="/"
        )
        
        response.set_cookie(
            key="discord_token",
            value=access_token,
            httponly=True,
            samesite="lax",
            secure=secure,
            max_age=60 * 24 * 7 * 60,
            path="/"
        )
        
        return {
            "access_token": jwt_token,
            "user": {
                "id": str(user_id),
                "username": user_json.get("username"),
                "avatar": user_json.get("avatar")
            }
        }

@router.get("/me")
async def get_me(request: Request, user: dict = Depends(get_current_user), bot = Depends(get_bot)):
    """Returns the user along with guilds they manage that the bot is also in."""
    from src.bot.core.config import BotConfig
    
    is_bot_admin = False
    if user.get("id") == "cms_admin":
        is_bot_admin = True
    else:
        owners = getattr(BotConfig.security, 'bot_owners', [])
        try:
            uid = int(user.get("id", 0))
            if uid in owners:
                is_bot_admin = True
        except:
            pass
    
    user["isAdmin"] = is_bot_admin
    discord_token = request.cookies.get("discord_token") or request.headers.get("X-Discord-Token")
    user_guilds = []
    
    if discord_token:
        async with httpx.AsyncClient() as client:
            guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
                "Authorization": f"Bearer {discord_token}"
            })
            if guilds_res.status_code == 200:
                all_guilds = guilds_res.json()
                for g in all_guilds:
                    perms = int(g.get("permissions", 0))
                    is_manageable = (perms & 0x20) == 0x20 or (perms & 0x8) == 0x8
                    
                    if is_manageable:
                        guild_id = int(g.get("id"))
                        if bot and bot.get_guild(guild_id):
                            user_guilds.append({
                                "id": str(guild_id),
                                "name": g.get("name"),
                                "icon": g.get("icon"),
                                "permissions": perms
                            })

    return {
        "user": user,
        "guilds": user_guilds
    }

@router.post("/logout")
async def logout(response: Response):
    """Logs out by clearing the access_token and discord_token cookies."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("discord_token", path="/")
    return {"success": True}
