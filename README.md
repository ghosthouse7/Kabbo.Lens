# 🎞️ Kabbo.Lens
### *A Generative Cultural Memory Engine for Kolkata*

> *"Every photograph holds a story that hasn't been told yet. Kabbo.Lens tells it."*

<div align="center">

![Kabbo.Lens Banner](https://img.shields.io/badge/Kabbo.Lens-Cultural%20Memory%20Engine-d4af37?style=for-the-badge&labelColor=0a0a0a)
![Tradition Hacks 2026](https://img.shields.io/badge/Tradition%20Hacks-2026-ff6b6b?style=for-the-badge&labelColor=0a0a0a)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go&labelColor=0a0a0a)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&labelColor=0a0a0a)
![GPT-4o](https://img.shields.io/badge/GPT--4o-Vision-412991?style=for-the-badge&logo=openai&labelColor=0a0a0a)

</div>

---

## 🌆 What is Kabbo.Lens?

Kabbo.Lens is a **multimodal generative AI engine** that decodes the visual DNA of Kolkata street photography and transforms it into culturally authentic creative outputs.

Upload a photograph of a North Kolkata lane, a Howrah Bridge ghat, a tram turning a corner, or a Kumartuli idol — and watch the AI generate:

- 🎬 **Cinematic indie-film scripts** in the tradition of Satyajit Ray
- ✒️ **Bengali poetry** inspired by Jibanananda Das
- 🎞️ **Director-ready storyboards** with shot-by-shot breakdowns

Unlike generic AI tools, Kabbo.Lens is built on **Kolkata's unique aesthetic grammar** — the chiaroscuro of North Kolkata lanes, tram culture, colonial decay, monsoon light, and the melancholy of a city that holds time differently.

---

## ✨ Features

### 🖼️ Multimodal Vision AI
GPT-4o Vision analyzes uploaded photographs and extracts cultural context, atmospheric mood, visual textures, and location-specific details unique to Kolkata.

### 🎬 Three Creative Output Modes
| Mode | Description |
|------|-------------|
| **Film Script** | 3-5 scene cinematic screenplay with Bengali-English dialogue |
| **Kavita** | 12-20 line poem in the Jibanananda Das tradition |
| **Storyboard** | 4-6 director shots with camera movement and lighting notes |

### 🗣️ Three Language Modes
- **Bilingual** — natural Bengali-English code-switching as real Kolkatans speak
- **Bengali** — pure বাংলা output
- **English** — full English for international audiences

### 🗺️ Kabbo.Map — Living Heritage Atlas
An interactive dark-mode map of Kolkata where every generated story gets pinned to its real location. Over time it becomes a **living generative memory archive** of the city, built photograph by photograph.

### 🧓 Dadu — AI Heritage Guide
Click any heritage pin on the map and meet **Dadu** — an 80-year-old Kolkata adda uncle AI. He narrates hidden secrets, ghost stories, and forgotten histories of each location in warm Bengali-English. You can chat with him and ask anything.

### 🎵 Soundscape Layer
Every generated output comes with contextually matched ambient sounds — tram bells, monsoon rain, dhak drums, adda chatter, crow calls — sourced from real field recordings via Freesound API.

### 📋 Miro Integration
Generated storyboards auto-build a visual **Miro board** with each shot as a card — watch a real Miro board construct itself live from a single photograph upload.

### 📄 PDF Zine Export
Export any generated output as a print-ready A4 zine with era-specific film grain filter applied to the photo, mood tags, and formatted content.

### 🎞️ Film Era Filters
- **Ray Era (1960s)** — Satyajit Ray sepia palette
- **Eastmancolor (1970s)** — faded warm tones
- **VHS Grain (1990s)** — grainy lo-fi aesthetic
- **Modern** — clean contemporary look

### 🗄️ Kabbo.Archive
Every generation is stored in a searchable archive grid, tagged by Kolkata neighbourhood, era, mood, and output type.

---

## 🏗️ Architecture

```
kabbolens/
├── backend/                    # Go + Gin REST API
│   ├── main.go                 # All handlers + routes
│   └── go.mod
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── App.jsx              # Main orchestrator
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Hero.jsx
    │   │   ├── UploadZone.jsx
    │   │   ├── ResultPanel.jsx
    │   │   ├── SoundPlayer.jsx  # Freesound integration
    │   │   ├── MiroWorkspace.jsx
    │   │   ├── HeritageMap.jsx  # Leaflet + Dadu AI Guide
    │   │   ├── ArchiveGrid.jsx
    │   │   └── FloatingOrbs.jsx
    │   └── styles/
    │       ├── globals.css
    │       └── animations.css
    └── index.html
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/generate` | Vision AI — generate creative output from image |
| `POST` | `/api/sound` | Freesound — fetch ambient audio by tag |
| `POST` | `/api/guide` | Dadu AI — heritage location guide + chat |
| `GET` | `/api/archive` | Fetch all generated stories |

---

## 🚀 Local Development

### Prerequisites
- Go 1.21+
- Node.js 18+
- GitHub Personal Access Token (for GitHub Models / GPT-4o)
- Freesound API Key (free at freesound.org/apiv2/apply)
- Miro API Token (optional, for board generation)

### Backend Setup

```bash
cd backend
go mod tidy

# Set environment variables
export GITHUB_TOKEN="ghp_your_token"
export FREESOUND_API_KEY="your_freesound_key"
export MIRO_TOKEN="your_miro_token"   # optional

go run main.go
# 🎞️ Kabbo.Lens backend on :8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Windows (PowerShell)

```powershell
$env:GITHUB_TOKEN="ghp_your_token"
$env:FREESOUND_API_KEY="your_freesound_key"
go run main.go
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy via Vercel CLI or connect GitHub repo at vercel.com
```

Set environment variable in Vercel dashboard:
```
VITE_BACKEND_URL=https://your-railway-app.up.railway.app
```

### Backend → Railway

1. Connect GitHub repo at railway.app
2. Set root directory to `backend/`
3. Add environment variables:
```
GITHUB_TOKEN=ghp_your_token
FREESOUND_API_KEY=your_key
PORT=8080
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | GitHub PAT for GPT-4o via GitHub Models |
| `FREESOUND_API_KEY` | ✅ Yes | Freesound API for ambient audio |
| `MIRO_TOKEN` | Optional | Miro OAuth token for board generation |
| `PORT` | Optional | Server port (default: 8080) |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.25, Gin, GitHub Models (GPT-4o Vision) |
| **Frontend** | React 19, Vite, Leaflet.js |
| **AI Model** | GPT-4o via GitHub Models API |
| **Audio** | Freesound API + Web Audio API fallback |
| **Maps** | Leaflet.js + Carto Dark Matter tiles |
| **Boards** | Miro REST API |
| **Export** | jsPDF |
| **Hosting** | Vercel (frontend) + Railway (backend) |

---

## 🏆 Built For

**Tradition Hacks 2026** — Generative AI and Creative Technology track

Kabbo.Lens is not just an AI tool — it is a **living generative memory engine** for an entire city. The map fills up over time. The archive grows. It becomes something no one else has built — a generative heritage database of Kolkata, constructed photograph by photograph, story by story.

---

## 👤 Author

**ghost_hunter** — [@ghosthouse7](https://github.com/ghosthouse7)

---

<div align="center">

*Kolkata's stories, frame by frame.*

**🎞️ Kabbo.Lens**

</div>
