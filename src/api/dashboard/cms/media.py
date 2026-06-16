from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File
from fastapi.responses import HTMLResponse
import uuid
import aiofiles
from pathlib import Path
from mxmariadb import CMSDatabase
from .utils import get_cms_db, get_maybe_user, is_admin, get_requester_info, UPLOAD_DIR, ALLOWED_MIME_TYPES, MAX_FILE_SIZE

router = APIRouter()

@router.post("/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    is_stock: bool = False,
    user: dict = Depends(get_maybe_user),
    db: CMSDatabase = Depends(get_cms_db)
):
    """Admin: upload a media file. Returns the public URL."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    ext = Path(file.filename).suffix.lower() if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    user_id, username = get_requester_info(request, user)
    form_data = await request.form()
    stock_flag = form_data.get("is_stock") == "true" or is_stock
    folder = form_data.get("folder", "general")

    await db.create_media(
        filename=unique_name,
        original_name=file.filename or unique_name,
        mime_type=file.content_type,
        size_bytes=len(content),
        uploader_id=user_id,
        uploader_name=username,
        is_stock=stock_flag,
        folder=folder
    )

    public_url = f"/uploads/cms/{unique_name}"
    return {"success": True, "url": public_url, "filename": unique_name, "is_stock": stock_flag}

@router.get("/media")
async def list_media(request: Request, is_stock: bool = None, folder: str = None, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: list uploaded media files, optionally filtered by stock status or folder."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        media = await db.get_media(is_stock=is_stock, folder=folder)
        for m in media:
            m["url"] = f"/uploads/cms/{m['filename']}"
        return {"success": True, "data": media}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/folders")
async def list_folders(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: list all custom media folders."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    folders = await db.get_folders()
    return {"success": True, "data": folders}

@router.post("/folders")
async def create_folder(request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: create a new media folder."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    data = await request.json()
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Folder name required")
    await db.create_folder(name)
    return {"success": True}

@router.delete("/folders/{name}")
async def delete_folder(name: str, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: delete a media folder."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    if name == "general":
        raise HTTPException(status_code=400, detail="Cannot delete general folder")
    await db.delete_folder(name)
    return {"success": True}

@router.put("/media/{media_id}")
async def update_media(media_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: update media properties (is_stock, folder, etc.)."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = await request.json()
    success = await db.update_media(media_id, **data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update media")
    return {"success": True}

@router.get("/media/view/{media_id}", response_class=HTMLResponse)
async def view_media_embed(media_id: int, request: Request, db: CMSDatabase = Depends(get_cms_db)):
    """Public: Returns an HTML page with Open Graph tags for Discord embeds."""
    try:
        media_list = await db.get_media(limit=1000)
        media_item = next((m for m in media_list if m["id"] == media_id), None)
        
        if not media_item:
            return HTMLResponse(content="<h1>Media not found</h1>", status_code=404)
        
        base_url = str(request.base_url).rstrip('/')
        image_url = f"{base_url}/uploads/cms/{media_item['filename']}"
        
        date_str = "Unknown date"
        if media_item.get("uploaded_at"):
            date_str = media_item["uploaded_at"].strftime("%d.%m.%Y %H:%M")
            
        title = media_item["original_name"]
        description = f"Hochgeladen am: {date_str} von {media_item.get('uploader_name', 'Unknown')}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title} - ManagerX Media</title>
            <meta property="og:type" content="website">
            <meta property="og:title" content="{title}">
            <meta property="og:description" content="{description}">
            <meta property="og:image" content="{image_url}">
            <meta name="theme-color" content="#3498db">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="{title}">
            <meta name="twitter:description" content="{description}">
            <meta name="twitter:image" content="{image_url}">
            <style>
                body {{ background-color: #050505; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                img {{ max-width: 90%; max-height: 80vh; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }}
                .info {{ margin-top: 20px; text-align: center; color: #a1a1aa; }}
                h1 {{ font-size: 1.2rem; color: #fff; margin-bottom: 5px; }}
            </style>
        </head>
        <body>
            <img src="{image_url}" alt="{title}">
            <div class="info">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Error</h1><p>{str(e)}</p>", status_code=500)

@router.delete("/media/{media_id}")
async def delete_media(media_id: int, request: Request, user: dict = Depends(get_maybe_user), db: CMSDatabase = Depends(get_cms_db)):
    """Admin: delete a media file from DB and disk."""
    if not is_admin(request, user):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        filename = await db.delete_media(media_id)
        if filename:
            file_path = UPLOAD_DIR / filename
            if file_path.exists():
                file_path.unlink()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
