# Minimalist YouTube Downloader (1080p Support)

A lightweight, high-performance YouTube video downloader built with **FastAPI** and **yt-dlp**. Designed for simplicity and maximum quality.

## 🚀 Features

- **1080p & 4K Support**: Automatically detects and merges separate video/audio streams using FFmpeg.
- **Resolution Selection**: Choose your preferred quality (1080p, 720p, 360p, etc.) from a dropdown menu.
- **Minimalist UI**: Clean, glassmorphism-inspired dark mode interface.
- **Fast Analysis**: Quick video metadata extraction and thumbnail preview.
- **Serverless Ready**: Configured for deployment on Vercel.

## 🛠️ Technology Stack

- **Backend**: Python, FastAPI, yt-dlp
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Processing**: FFmpeg (for merging high-quality DASH streams)

## 📋 Prerequisites

- **Python 3.8+**
- **FFmpeg**: Must be installed and available on your system PATH.

## ⚡ Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/booncek/downloadvideos.git
   cd downloadvideos
   ```

2. **Set up a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python -m uvicorn main:app --reload
   ```

5. **Open in browser**:
   Navigate to `http://localhost:8000`.

## 📂 Project Structure

- `main.py`: FastAPI server logic and extraction/download endpoints.
- `static/`: Frontend assets (HTML, CSS, JS).
- `requirements.txt`: Python dependencies.
- `vercel.json`: Deployment configuration for Vercel.

## 📝 License

MIT License. Feel free to use and modify!
