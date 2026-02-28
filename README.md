# Ultra-Minimal Video Downloader

A premium, high-performance video downloader built with **FastAPI** and **yt-dlp**. Featuring an ultra-minimalist design with full dark mode support and containerized deployment.

## 🚀 Key Features

- **Ultra-Minimalist UI**: A clean, single-centered input design inspired by the latest premium UX trends.
- **Dark Mode Toggle**: Fluid theme switching with persistent user preference (saved to local storage).
- **1080p & 4K Support**: Automatically merges high-quality DASH streams using FFmpeg.
- **Resolution Selection**: Intelligent detection of all available formats and resolutions.
- **Dockerized**: Fully containerized setup for seamless deployment on any platform.

## 🛠️ Technology Stack

- **Backend**: Python 3.11, FastAPI, yt-dlp
- **Frontend**: Vanilla HTML5, Vanilla CSS (Design System based), Modern JavaScript
- **Processing**: FFmpeg
- **Infrastructure**: Docker & Docker Compose

## 🐳 Docker Setup (Recommended)

The easiest way to run the application on any platform:

1. **Start the application**:
   ```bash
   docker compose up --build -d
   ```
2. **Access the UI**: Navigate to `http://localhost:8000`.
3. **Downloads**: Videos are saved to the `downloads/` folder on your host machine via Docker volumes.

## ⚡ Local Development

If you prefer to run it natively (requires Python and FFmpeg installed):

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Run the Server**:
   ```bash
   python -m uvicorn main:app --reload
   ```

## 📂 Project Structure

- `main.py`: Core logic for extraction and download.
- `static/`: Modern, framework-free frontend.
- `Dockerfile`: Multi-platform Linux environment with pre-installed FFmpeg.
- `docker-compose.yml`: Simplified orchestration and volume mapping.

## 📝 License

MIT License. Free to use and modify!
