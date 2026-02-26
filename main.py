import os
import uuid
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="Minimalist YouTube Downloader")

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

DOWNLOADS_DIR = "downloads"
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

class ExtractRequest(BaseModel):
    url: str

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/extract")
async def extract_video(request: ExtractRequest):
    url = request.url

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }

    try:
        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))

        if not info:
            raise HTTPException(status_code=400, detail="Could not extract video info")

        formats = info.get('formats', [])

        # We want to build a list of all unique available heights (resolutions)
        # For each height, determine if it can be a direct url (combined format exists)
        # or if it requires a merge (only separate video/audio exists).

        res_map = {}

        # 1. Process combined formats (direct downloads)
        combined_formats = [f for f in formats if f.get('vcodec') != 'none' and f.get('acodec') != 'none']
        for f in combined_formats:
            h = f.get('height')
            if h and h not in res_map:
                res_map[h] = {
                    "height": h,
                    "resolution": f"{h}p",
                    "needs_merge": False,
                    "url": f.get("url"),
                    "ext": f.get("ext", "mp4")
                }

        # 2. Process separate video formats (requires merge)
        video_formats = [f for f in formats if f.get('vcodec') != 'none']
        for f in video_formats:
            h = f.get('height')
            if h and h not in res_map:
                res_map[h] = {
                    "height": h,
                    "resolution": f"{h}p",
                    "needs_merge": True,
                    "url": None, # Signal that it needs server-side merging
                    "ext": "mp4" # We output merged files as mp4
                }

        # Prepare the sorted list of resolutions (highest to lowest)
        resolutions = sorted(res_map.values(), key=lambda x: x["height"], reverse=True)

        if not resolutions:
            # Fallback if no specific height found
            resolutions = [{
                "height": 0,
                "resolution": "Best",
                "needs_merge": False,
                "url": info.get("url"),
                "ext": info.get("ext", "mp4")
            }]

        return {
            "title": info.get("title", "Unknown Title"),
            "thumbnail": info.get("thumbnail"),
            "resolutions": resolutions,
            "url": request.url,
            "duration": info.get("duration")
        }

    except Exception as e:
        print(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting video: {str(e)}")

# Download request model
class DownloadRequest(BaseModel):
    url: str
    height: int

@app.post("/api/download")
async def download_video(request: DownloadRequest):
    """
    Download + merge the requested video resolution and best audio using yt-dlp + ffmpeg,
    then stream the result to the user.
    """
    url = request.url
    height = request.height

    job_id = uuid.uuid4().hex
    output_path = os.path.join(DOWNLOADS_DIR, f"{job_id}.mp4")

    # Format string specifically selects the requested height
    format_str = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]'

    # Resolve ffmpeg path (installed via winget)
    ffmpeg_exe = os.path.join(os.environ.get('LOCALAPPDATA', ''), 
                              'Microsoft', 'WinGet', 'Packages', 
                              'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 
                              'ffmpeg-8.0.1-full_build', 'bin', 'ffmpeg.exe')

    ydl_opts = {
        'format': format_str,
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
        'merge_output_format': 'mp4',
        'ffmpeg_location': ffmpeg_exe if os.path.exists(ffmpeg_exe) else None,
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
    }

    try:
        loop = asyncio.get_event_loop()

        def do_download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return info

        info = await loop.run_in_executor(None, do_download)

        # yt-dlp may append extensions; find the actual file
        actual_path = output_path
        if not os.path.exists(actual_path):
            # Try common suffixes
            for ext in ['.mp4', '.mkv', '.webm']:
                candidate = os.path.join(DOWNLOADS_DIR, f"{job_id}{ext}")
                if os.path.exists(candidate):
                    actual_path = candidate
                    break

        if not os.path.exists(actual_path):
            raise HTTPException(status_code=500, detail="Downloaded file not found")

        title = info.get('title', 'video').replace('/', '-').replace('\\', '-')
        filename = f"{title}_{height}p.mp4"

        return FileResponse(
            path=actual_path,
            media_type='video/mp4',
            filename=filename,
            background=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
