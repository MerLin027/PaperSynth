# PaperSynth - AI-Powered Research Paper Synthesis

**Transform research papers into comprehensive summaries, audio content, and presentations using advanced AI.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:full

# Or start separately
npm run backend  # Backend on port 8000
npm run dev      # Frontend on port 3000
```

Then open: `http://localhost:3000`

## 📚 Documentation

**Complete integration guides and documentation are in the [`docs/`](docs/) folder.**

- 🌟 **[Integration Analysis](docs/INTEGRATION_ANALYSIS.md)** - Start here!
- 📖 **[Documentation Index](docs/INDEX.md)** - Full documentation index
- 🔧 **[Quick Reference](docs/QUICK_REFERENCE.md)** - Common commands and patterns

## Project info

**URL**: https://lovable.dev/projects/6a38a0c7-2d7e-44ac-bc87-46fbd131b48e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6a38a0c7-2d7e-44ac-bc87-46fbd131b48e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ Technologies

### Frontend
- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Python FastAPI** - Backend framework
- **Gemini AI** - Text summarization
- **ElevenLabs** - Text-to-speech
- **PyMuPDF** - PDF processing
- **python-pptx** - PowerPoint generation

## 🎯 Features

- 📄 **PDF Upload** - Drag-and-drop interface for research papers
- 🤖 **AI Summarization** - Powered by Google Gemini
- 🎙️ **Text-to-Speech** - Natural voice synthesis with ElevenLabs
- 📊 **PowerPoint Generation** - Automatic presentation creation
- 🖼️ **Graphical Abstracts** - Visual summaries (optional, with SDXL)
- ⚡ **Real-time Processing** - Live status updates

## 📦 Project Structure

```
paper-synth-main/
├── src/                    # Frontend source code
│   ├── pages/             # React pages
│   ├── services/          # Backend integration services
│   ├── components/        # UI components
│   └── lib/               # Utilities and API client
├── docs/                  # Documentation
├── main.py               # Python FastAPI backend
├── backend.env           # Backend configuration
└── .env                  # Frontend configuration
```

## 🔧 Configuration

See [`docs/INTEGRATION_ANALYSIS.md`](docs/INTEGRATION_ANALYSIS.md) for complete setup instructions.

## 📖 Need Help?

- **Integration Issues?** → [docs/INTEGRATION_ANALYSIS.md](docs/INTEGRATION_ANALYSIS.md)
- **API Usage?** → [docs/API_USAGE_GUIDE.md](docs/API_USAGE_GUIDE.md)
- **Quick Reference?** → [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)
- **Full Index?** → [docs/INDEX.md](docs/INDEX.md)

## 🚀 Deployment

Simply open [Lovable](https://lovable.dev/projects/6a38a0c7-2d7e-44ac-bc87-46fbd131b48e) and click on Share -> Publish.

For custom domain setup, see: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

**Built for CHARUSAT - 5th Semester SGP Project**
