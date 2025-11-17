# PaperSynth

## 1. Project Overview
This project provides PaperSynth, an AI-powered synthesis tool for generating alternative content from research papers. It allows users to upload a research paper (PDF) and automatically generates:
- **Summarized Content**
- **AI-generated Podcast**
- **Presentation Slides**

This tool enables researchers, students, and professionals to quickly understand and present research findings in various formats using AI models.

## 2. Features
- **PDF Extraction:** Extracts text from research papers (up to 10MB, 100 pages).
- **AI-powered Summarization:** Uses Google Gemini AI (gemini-2.0-flash) to summarize research papers with high quality.
- **AI Voiceover:** Converts summaries into AI-generated audio using ElevenLabs TTS.
- **Presentation Slides:** Creates PowerPoint presentations from summarized content.
- **User Interface:** Provides an interactive UI via Streamlit.
- **RESTful API:** FastAPI backend with authentication and rate limiting.

## 3. Tech Stack
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
- **PDF Processing:** PyMuPDF (fitz), FPDF
- **Presentation Generation:** python-pptx
# PaperSynth

PaperSynth is an AI-powered tool that extracts knowledge from research papers (PDFs) and produces concise summaries, optional AI voiceovers, and presentation slides to help readers quickly consume and share findings.

**Key outputs:** summaries, audio narration, and PowerPoint slides generated from uploaded PDFs.

**Repository:** https://github.com/MerLin027/PaperSynth

---

## Features

- PDF extraction and text processing (supports typical research-paper sizes)
- Configurable AI summarization (Google Generative Models)
- Optional TTS (ElevenLabs) to create an audio podcast-style narration
- Presentation generation (PowerPoint via python-pptx)
- REST API (FastAPI) with authentication, rate-limiting, and file hosting
- Clean React + TypeScript UI (Vite, Tailwind, shadcn-ui)

---

## Tech Stack

- Backend: Python, FastAPI, Uvicorn
- Frontend: React + TypeScript, Vite, Tailwind CSS, shadcn-ui
- AI: Google Generative Language (Gemini family) and optional ElevenLabs TTS
- PDF: PyMuPDF (fitz), FPDF
- Presentation: python-pptx

---

## Quick Start (development)

These steps assume Windows PowerShell (adapt for macOS/Linux accordingly).

1) Clone the repo

```powershell
git clone https://github.com/MerLin027/PaperSynth.git
cd "paper-synth-main"
```

2) Backend: create and activate a virtual environment, then install Python deps

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

3) Frontend: install Node deps (run from repository root)

```powershell
npm install
```

4) Environment variables

- Backend env: copy `backend.env.example` -> `backend.env` and fill values (recommended)
- Frontend env: create `.env` with these vars for development:

```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_API_AUTH_TOKEN=your-api-auth-token
```

Required backend keys (examples): `GEMINI_API_KEY`, `ELEVENLABS_API_KEY` (if TTS), `API_AUTH_TOKEN`.

5) Run servers (two terminals)

Backend (terminal A):
```powershell
.\.venv\Scripts\Activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend (terminal B):
```powershell
npm run dev
```

Open the UI at `http://localhost:3000`.

---

## API (overview)

- POST `/process-paper/` — upload a PDF and request processing (summary / audio / slides). Include `Authorization: Bearer <API_AUTH_TOKEN>` when `API_AUTH_TOKEN` is enabled.
- GET `/status/{request_id}` — check processing status and asset links
- GET `/health` — readiness check

Example curl upload (replace token and file):

```bash
curl -X POST "http://localhost:8000/process-paper/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@./my_paper.pdf" \
  -F "summary_length=medium" \
  -F "generate_audio=true"
```

The API will return JSON containing a `request_id`. Poll `/status/{request_id}` to retrieve generated asset URLs (summary, audio, slides, PDF).

---

## Configuration

- `backend.env` (or your environment):
  - `GEMINI_API_KEY` — Google Generative Language API key
  - `ELEVENLABS_API_KEY` — ElevenLabs key (optional)
  - `API_AUTH_TOKEN` — shared bearer token for frontend ↔ backend
  - `ALLOWED_CORS_ORIGINS` — comma-separated origins (default `http://localhost:3000`)
  - `ENABLE_TTS` — `true|false` to enable audio generation
  - `SIGNED_DOWNLOADS` / `DOWNLOAD_SIGNING_KEY` — optional short-lived signed URLs
  - `RATE_LIMIT_PER_MINUTE`, `CONCURRENCY_LIMIT`, `TEMP_TTL_HOURS`, `TEMP_SIZE_CAP_GB`

Frontend development config: use `VITE_API_BASE_URL` and `VITE_API_AUTH_TOKEN` in `.env` (Vite will expose `VITE_` prefixed vars to the client).

---

## Troubleshooting

- Gemini API errors: ensure the Google Generative Language API is enabled for your Google Cloud project and the `GEMINI_API_KEY` is valid and has quota.
- 500-summary errors often indicate API key, model, or quota issues — check backend logs and confirm model alias in `main.py` (we recommend using a stable alias such as `gemini-flash-latest`).
- If uploads fail with large PDFs, confirm file size limits and increase `TEMP_SIZE_CAP_GB` or frontend validation as needed.
- TTS issues: supply a valid `ELEVENLABS_API_KEY` or set `ENABLE_TTS=false`.

Common commands:

```powershell
# activate venv
.\.venv\Scripts\Activate
# show backend logs (if running via uvicorn)
# (use your terminal's method to view output)
```

---

## Project layout (high level)

Files and folders you will use frequently:

- `main.py` — FastAPI backend entrypoint
- `requirements.txt` — Python dependencies
- `package.json` — frontend scripts & deps
- `src/` — React application source
- `backend.env.example` — sample backend env file
- `temp_files/` — generated artifacts (cleaned according to TTL)

---

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request. If you plan to work on the codebase, open an issue first so we can coordinate.

---

## License

This project is licensed under the MIT License.

---

## Notes / Next steps

- After editing environment values, restart the backend to pick up changes.
- If you'd like, I can commit and push this README update for you and/or open a PR with the changes.

---

## 11. Contributors
**Vrushank Ganatra**

---

## 12. License
This project is licensed under the MIT License.
- Health/status: `GET /health` for readiness; `GET /status/{request_id}` to check available assets.
- Observability: Every request gets an `X-Request-ID` header and is logged with that ID; Authorization header is redacted in logs.