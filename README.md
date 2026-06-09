# Kabbo.Lens 🎞️

> *Every photograph contains a forgotten story.*

An AI-powered cultural memory engine that transforms Kolkata photographs into cinematic narratives, Bengali poetry, and heritage storyboards — rooted in the soul of the city.

Built for **Tradition Hacks 2026**.

---

## What It Does

Upload any photograph of Kolkata. Kabbo.Lens decodes its visual DNA and generates:

- **Film Scripts** — Cinematic indie screenplays in the style of Satyajit Ray
- **Kavita** — Bengali poetry inspired by Jibanananda Das
- **Storyboards** — Director's shot breakdowns with camera and lighting notes

Every output includes ambient soundscapes, heritage map pins, PDF zine exports, and Miro board integration.

---

## Features

| Feature | Description |
|---|---|
| Vision AI | GPT-4o analyzes uploaded photographs |
| Film Era Filter | Ray Era · Eastmancolor · VHS Grain · Modern |
| Bilingual Output | Bengali · English · Natural code-switching |
| Heritage Map | Interactive Kolkata map with story pins |
| AI Dadu Guide | 80-year-old Kolkata uncle narrates hidden secrets of heritage sites |
| Reverse Image Search | Upload a photo to identify and locate Kolkata landmarks |
| Ambient Soundscape | Tram bells · Monsoon rain · Dhak drums · Adda chatter |
| Narrator | Browser TTS reads Bengali and English output aloud |
| Miro Integration | Push storyboards to a Miro board in one click |
| PDF Zine | Export any output as a cinematic film-reel styled PDF |
| Archive | Session memory of all generated stories |

---

## Tech Stack

**Frontend**
- React + Vite
- Leaflet.js (Heritage Map)
- Web Speech API (Narrator)
- Web Audio API (Sound synthesis fallback)
- Cormorant Garamond + DM Mono (Typography)

**Backend**
- Go + Gin
- GitHub Models API (GPT-4o vision)
- Freesound API (Ambient audio)
- Miro API v2 (Board creation)

**Infrastructure**
- Frontend → Vercel
- Backend → Railway

---

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- GitHub Personal Access Token (for GPT-4o via GitHub Models)

### Backend

```bash
cd backend
export GITHUB_TOKEN=your_token_here
export FREESOUND_API_KEY=your_key_here
export MIRO_TOKEN=your_token_here
go run main.go
```

Backend runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate` | Generate script/poem/storyboard from image |
| POST | `/api/guide` | Ask Dadu about a heritage location |
| POST | `/api/identify` | Reverse image search — identify Kolkata location |
| POST | `/api/sound` | Fetch ambient sound via Freesound |
| POST | `/api/miro` | Push generated content to Miro board |
| GET | `/api/archive` | Retrieve session story archive |
| GET | `/health` | Health check |

---

## Environment Variables

**Backend**
```
GITHUB_TOKEN       — GitHub Personal Access Token (GPT-4o access)
FREESOUND_API_KEY  — Freesound API key
MIRO_TOKEN         — Miro OAuth access token
PORT               — Server port (default: 8080)
```

---

## Heritage Locations

Kabbo.Lens maps generated stories to these Kolkata landmarks:

- College Street · Howrah Bridge · Kumartuli
- Maidan Tram Depot · Park Street · Rabindra Sarani
- Jorasanko · Shyambazar · Esplanade · North Kolkata

---

## Project Structure

```
kabbolens/
├── backend/
│   └── main.go                 — Go API server
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Hero.jsx
        │   ├── LandingPage.jsx
        │   ├── UploadZone.jsx
        │   ├── ResultPanel.jsx
        │   ├── SoundPlayer.jsx
        │   ├── HeritageMap.jsx
        │   ├── ArchiveGrid.jsx
        │   ├── MiroWorkspace.jsx
        │   └── FloatingOrbs.jsx
        └── styles/
            └── globals.css
```

---

## The Vision

Kolkata is a city that holds time differently. Its lanes remember partition, its trams carry the weight of a century, its addas have solved the world's problems over endless cups of chai.

Kabbo.Lens exists to ensure these memories don't disappear — by giving every photograph a voice, a story, and a place on the map.

---

*Kolkata's stories, frame by frame.*
