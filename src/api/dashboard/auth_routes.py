from fastapi import APIRouter, Request, HTTPException, Security, status, Depends
from fastapi.responses import RedirectResponse
import httpx
import jwt
import os
import time
from urllib.parse import urlencode

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# JWT Setup
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

# Discord OAuth Setup
CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:8080/dash/auth/callback")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:8080")

# We import bot_instance dynamically or keep a local ref if passed
# Removed top level import to prevent circular import

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request):
    """Dependency to get the current user from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "username": payload.get("username", ""), "avatar": payload.get("avatar", "")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/login")
async def login():
    """Generates the Discord OAuth2 Authorization URL and redirects the user."""
    # We want to respond to the dashboard frontend, passing the code back to the frontend.
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

@router.post("/callback")
async def callback(request: Request):
    """Exchanges code for a token and creates a JWT session."""
    data = await request.json()
    code = data.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
        
    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        try:
            token_res = await client.post("https://discord.com/api/oauth2/token", data=token_data, headers=headers)
            token_res.raise_for_status()
            token_json = token_res.json()
            access_token = token_json.get("access_token")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to exchange token: {e}")
            
        # Get user info
        user_res = await client.get("https://discord.com/api/users/@me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        user_json = user_res.json()
        user_id = user_json.get("id")
        
        # Verify if user has admin permissions on any guild bot is in (we handle actual guilds in /me)
        # For now, just generate JWT
        jwt_token = create_access_token({
            "sub": user_id,
            "username": user_json.get("username"),
            "avatar": user_json.get("avatar")
        })
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": str(user_id),
                "username": user_json.get("username"),
                "avatar": user_json.get("avatar")
            },
            "discord_token": access_token # Send discord token to frontend to fetch guilds
        }

@router.get("/me")
async def get_me(request: Request, user: dict = Depends(get_current_user)):
    """Returns the user along with guilds they manage that the bot is also in."""
    from src.api.dashboard.routes import bot_instance
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
         raise HTTPException(status_code=401)
    
    # In a real app, we'd store the Discord Access Token in a session or database.
    # For now, let's assume the client might send it or we fetch it if we had it.
    # To make this "really work" without a DB yet, we expect a 'X-Discord-Token' header 
    # or just use the one from the callback if we were to store it.
    
    discord_token = request.headers.get("X-Discord-Token")
    user_guilds = []
    
    if discord_token:
        async with httpx.AsyncClient() as client:
            guilds_res = await client.get("https://discord.com/api/users/@me/guilds", headers={
                "Authorization": f"Bearer {discord_token}"
            })
            if guilds_res.status_code == 200:
                all_guilds = guilds_res.json()
                for g in all_guilds:
                    # check permissions (Manage Guild = 0x20)
                    perms = int(g.get("permissions", 0))
                    is_admin = (perms & 0x20) == 0x20 or (perms & 0x8) == 0x8
                    
                    if is_admin:
                        # Check if bot is in guild
                        guild_id = int(g.get("id"))
                        if bot_instance and bot_instance.get_guild(guild_id):
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
