# PaperSynth

## Project Overview
This project provides PaperSynth, an AI-powered synthesis tool for generating alternative content from research papers. It allows users to upload a research paper (PDF) and automatically generates:
- **Summarized Content**
- **AI-generated Podcast**
- **Presentation Slides**

This tool enables researchers, students, and professionals to quickly understand and present research findings in various formats using AI models.

## Features
- **PDF Extraction:** Extracts text from research papers (up to 10MB, 100 pages).
- **AI-powered Summarization:** Uses Google Gemini AI (gemini-2.0-flash) to summarize research papers with high quality.
- **AI Voiceover:** Converts summaries into AI-generated audio using ElevenLabs TTS.
- **Presentation Slides:** Creates PowerPoint presentations from summarized content.
- **Graphical Abstracts:** Generates visual representations using Stable Diffusion XL (optional).
- **User Interface:** Provides an interactive UI via Streamlit.
- **RESTful API:** FastAPI backend with authentication and rate limiting.

## Tech Stack
- **Backend:** FastAPI (port 8000), Uvicorn
- **Frontend:** 
  - React with TypeScript
  - Vite build tool
  - shadcn-ui components
  - Tailwind CSS for styling
  - Runs on port 3000
- **AI Models:**
  - Google Gemini AI (gemini-2.0-flash) for summarization
  - ElevenLabs TTS for audio generation
  - Stable Diffusion XL for visual abstracts (optional)
- **PDF Processing:** PyMuPDF (fitz), FPDF
- **Presentation Generation:** python-pptx
- **Security:** Bearer token authentication, rate limiting, CORS
- **Deployment:** Uvicorn ASGI server (backend), Vite dev server (frontend)

---

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your system:
- Python 3.8+
- Node.js & npm (for frontend) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- pip
- virtualenv (recommended)
- CUDA-enabled GPU (optional but recommended for SDXL)

### 1. Clone the Repository
```sh
git clone https://github.com/MerLin027/papersynth.git
cd papersynth
```

### 2. Install Backend Dependencies
```sh
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies
```sh
cd frontend  # or wherever your React app is located
npm install
cd ..
```

### 4. Set Up API Keys
Create a `.env` file in the root directory and add your API keys:
```ini
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
HUGGINGFACE_API_TOKEN=your-huggingface-api-token  # Optional - only needed for SDXL
API_AUTH_TOKEN=your-secret-token
```
**Required API Keys:**
- `GEMINI_API_KEY`: Get from https://aistudio.google.com/app/apikey (required for text summarization)
- `ELEVENLABS_API_KEY`: Get from https://elevenlabs.io/ (required for text-to-speech)

**Optional:**
- `HUGGINGFACE_API_TOKEN`: Only needed if you enable SDXL image generation

### 5. Run the Backend Server
```sh
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
This will start the FastAPI backend.

### 6. Run the Frontend (in a separate terminal)
```sh
cd frontend
npm run dev
```
The React application will be available at `http://localhost:3000/`.

**Alternative:** Use `start_project.bat` (Windows) to start both servers automatically.

Notes:
- Generated files are served under `/static/{request_id}/...` and links are returned by the API.
- If no CUDA GPU is present, Stable Diffusion falls back to CPU (slower).
- Frontend communicates with backend via REST API at `http://localhost:8000`
- CORS: By default the API allows `http://localhost:3000`. To add more, set `ALLOWED_CORS_ORIGINS` env (comma-separated).

### Configuration (environment variables)
- `GEMINI_API_KEY`: Google Gemini API key (required for AI text summarization)
- `ELEVENLABS_API_KEY`: ElevenLabs TTS key (required for audio when enabled)
- `HUGGINGFACE_API_TOKEN`: Hugging Face token to pull SDXL (optional - only needed for visuals when enabled)
- `API_AUTH_TOKEN`: Bearer token required by the backend; set in Streamlit env too
- `ALLOWED_CORS_ORIGINS`: Comma-separated list of allowed browser origins (default `http://localhost:3000`)
- `ENABLE_SDXL`: `true|false` to enable/disable graphical abstract generation (default `true`)
- `ENABLE_TTS`: `true|false` to enable/disable audio generation (default `true`)
- `SIGNED_DOWNLOADS`: `true|false` to enable signed, short-lived download URLs (default `false`)
- `DOWNLOAD_SIGNING_KEY`: Secret used to sign download URLs (required if `SIGNED_DOWNLOADS=true`)
- `RATE_LIMIT_PER_MINUTE`: Requests per minute per token/IP (default `10`)
- `CONCURRENCY_LIMIT`: Max concurrent processing jobs (default `2`)
- `TEMP_TTL_HOURS`: Hours to keep generated files (default `24`)
- `TEMP_SIZE_CAP_GB`: Max temp storage before pruning oldest (default `1`)

### Example reverse proxy (Nginx)
```
server {
    listen 443 ssl;
    server_name your.domain;

    ssl_certificate /path/fullchain.pem;
    ssl_certificate_key /path/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## Troubleshooting

### 1. API Key Errors
- Ensure `.env` file is correctly set up.
- Reload the environment: `source venv/bin/activate` or `venv\Scripts\activate` (Windows).

### 2. CUDA Errors
- Ensure you have installed PyTorch with CUDA support if using a GPU.
- Use CPU mode if necessary by modifying `pipe.to("cuda")` to `pipe.to("cpu")` in `main.py`.
- Fallback to CPU in case of CUDA absence is present.

### 3. Missing Dependencies
- **Backend:** Run `pip install -r requirements.txt` to install all Python dependencies.
- **Frontend:** Run `npm install` in the frontend directory.
- Ensure you are inside the virtual environment when running the backend application.

### 4. Frontend Build Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (Node 16+ recommended)

---

## Documentation
- **SETUP_GUIDE.md** - Detailed setup instructions with troubleshooting
- **PAPER_GUIDE.md** - AI agent guide for generating research papers about this project
- **PORT_CHANGES_SUMMARY.md** - Documentation of port configuration changes
- **BACKEND_ISSUES_FIXED.md** - Backend troubleshooting and fixes

## Future Enhancements
- **Batch Processing:** Process multiple papers simultaneously
- **Multi-Language Support:** Summarization and translation in multiple languages
- **Reference Manager Integration:** Zotero, Mendeley plugins
- **DOI/URL Fetching:** Direct paper download from DOI or URLs
- **Custom Templates:** Customizable presentation and summary templates
- **User Accounts:** History tracking and saved preferences
- **Table/Figure Extraction:** Extract and describe tables and figures from PDFs
- **Citation Analysis:** Extract and visualize citation networks

---

## License
This project is licensed under the MIT License.

---

## Project Structure
```
paper-synth/
├── backend/
│   ├── main.py                # FastAPI backend server
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment config
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   └── App.tsx           # Main React app
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── start_project.bat         # Windows startup script
├── PAPER_GUIDE.md           # Research paper generation guide
├── SETUP_GUIDE.md           # Detailed setup instructions
└── temp_files/              # Temporary storage for generated files
```

## Contributors
- **Vrushank Ganatra**

---

## Security & Ops

- Authentication: Backend requires `Authorization: Bearer <API_AUTH_TOKEN>` on POST `/process-paper/` (if `API_AUTH_TOKEN` is set).
- Rate limiting & concurrency: Per-token/IP rate limit (`RATE_LIMIT_PER_MINUTE`, default 10) and global concurrency cap (`CONCURRENCY_LIMIT`, default 2).
- CORS & HTTPS: Allow browser origins via `ALLOWED_CORS_ORIGINS`. Terminate TLS at a reverse proxy and forward `X-Forwarded-*` headers.
- Signed downloads (optional): Enable with `SIGNED_DOWNLOADS=true` and set `DOWNLOAD_SIGNING_KEY`. Links expire quickly and are HMAC-verified at `/download`.
- Feature flags: Toggle heavy features via `ENABLE_SDXL` and `ENABLE_TTS`.
- Health/status: `GET /health` for readiness; `GET /status/{request_id}` to check available assets.
- Observability: Every request gets an `X-Request-ID` header and is logged with that ID; Authorization header is redacted in logs.