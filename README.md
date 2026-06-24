<div align="center">

<!-- Animated film strip header -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=d4a847&height=120&section=header&text=Kabbo.Lens&fontSize=52&fontColor=0a0907&fontAlignY=38&desc=Cultural%20Memory%20Engine%20%C2%B7%20Kolkata&descAlignY=58&descSize=16&descColor=0a0907"/>

<br/>

[![Live Demo](https://img.shields.io/badge/▶%20Live%20Demo-kabbo--lens.vercel.app-d4a847?style=for-the-badge&labelColor=0a0907)](https://kabbo-lens.vercel.app)
[![Backend](https://img.shields.io/badge/⚙%20Backend-Railway-d4a847?style=for-the-badge&labelColor=0a0907)](https://kabbolens-production.up.railway.app/health)
[![Docker](https://img.shields.io/badge/🐳%20Docker-Compose-d4a847?style=for-the-badge&labelColor=0a0907)](#docker)
[![Hackathon](https://img.shields.io/badge/🏆%20Tradition%20Hacks-2026-d4a847?style=for-the-badge&labelColor=0a0907)](#)

<br/>

> *Every photograph contains a forgotten story.*
> *Upload it. Watch Kolkata speak.*

<br/>

```
┌─────────────────────────────────────────────────────────────┐
│  ◉ ◉ ◉ ◉ ◉    K A B B O . L E N S    ◉ ◉ ◉ ◉ ◉           │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                             │
│   Upload photograph  →  AI decodes visual DNA              │
│   Identifies location →  Dadu reveals hidden secrets       │
│   Generates script   →  Exports PDF zine + Miro board      │
│                                                             │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  ◉ ◉ ◉ ◉ ◉  Kolkata · 1847 – Present  ◉ ◉ ◉ ◉ ◉          │
└─────────────────────────────────────────────────────────────┘
```

</div>

---

## ✦ What Is Kabbo.Lens?

Kabbo.Lens is an AI-powered **cultural memory engine** for Kolkata. It takes any photograph and transforms it into living narrative — pinning it onto a heritage map, identifying exactly where it was taken, and letting an AI guide called **Dadu** reveal the hidden secrets of that place.

---

## ✦ Core Features

<table>
<tr>
<td width="50%">

### 🔍 Reverse Image Search
Upload any Kolkata photograph. The AI identifies **exactly which heritage location** it is — Howrah Bridge, College Street, Kumartuli — and pins it live on the map.

</td>
<td width="50%">

### 👴 AI Dadu — Heritage Guide
An 80-year-old Kolkata adda uncle who knows every hidden lane, ghost story, and secret of the city. Ask him about any location — he responds in warm Bengali-English code-switching.

</td>
</tr>
<tr>
<td>

### 🎬 Creative Generation
Three output modes powered by GPT-4o vision:
- **Film Script** — Satyajit Ray style
- **Kavita** — Jibanananda Das poetry
- **Storyboard** — Director's shot breakdown

</td>
<td>

### 🗺 Heritage Memory Map
Interactive Carto dark map with glowing gold pins for 10 heritage sites. Generated stories are pinned live as you create them.

</td>
</tr>
<tr>
<td>

### ◫ Miro Integration
Push any generated storyboard directly to a Miro board — title cards, scene sticky notes, tag panels, all auto-arranged.

</td>
<td>

### 📄 PDF Zine Export
Every output exports as a cinematic film-reel styled PDF — black pages, gold typography, perforated film strip borders.

</td>
</tr>
</table>

---

## ✦ The Star Feature — AI Dadu

```
You: "Tell me about College Street"

Dadu: "Arre, ki bolbo tumi — I remember sitting in 
       Coffee House in '72, Sunil Gangopadhyay at 
       the next table arguing about Naxalbari...
       
       The secret nobody tells you? The vendor at 
       the corner sells first editions that collectors 
       fly from London to buy. And the boy who makes 
       your chai? His grandfather served tea to 
       Rabindranath himself..."
```

Dadu knows secrets about **10 Kolkata heritage locations** — and uses GPT-4o to generate fresh, personal stories every time.

---

## ✦ Tech Stack

```
Frontend          Backend           Infrastructure
─────────         ───────           ──────────────
React + Vite      Go + Gin          Vercel (Frontend)
Leaflet.js        GPT-4o Vision     Railway (Backend)
Web Speech API    GitHub Models     Docker Compose
Cormorant         Miro API v2       
Garamond          Freesound API     
```

---

## ✦ Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/ghosthouse7/Kabbo.Lens.git
cd Kabbo.Lens

# Set your keys
export GITHUB_TOKEN=your_token
export MIRO_TOKEN=your_miro_token
export FREESOUND_API_KEY=your_freesound_key

# Launch everything
docker-compose up --build
```

Frontend → `http://localhost:5173`  
Backend → `http://localhost:8080`

### Option 2 — Manual

```bash
# Backend
cd backend
export GITHUB_TOKEN=your_token
go run main.go

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## ✦ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate script · poem · storyboard from image |
| `POST` | `/api/identify` | Reverse image search — identify Kolkata location |
| `POST` | `/api/guide` | Ask Dadu about any heritage location |
| `POST` | `/api/miro` | Push generated content to Miro board |
| `GET`  | `/api/archive` | Retrieve all generated stories this session |
| `GET`  | `/health` | Health check |

---

## ✦ Environment Variables

```env
GITHUB_TOKEN        GitHub Personal Access Token (GPT-4o)
FREESOUND_API_KEY   Freesound API key (ambient sounds)  
MIRO_TOKEN          Miro OAuth access token
PORT                Server port (default: 8080)
```

---

## ✦ Heritage Locations

```
◉ College Street      ◉ Howrah Bridge      ◉ Kumartuli
◉ Maidan Tram Depot   ◉ Park Street        ◉ Rabindra Sarani  
◉ Jorasanko           ◉ Shyambazar         ◉ Esplanade
◉ North Kolkata
```

---

## ✦ Project Structure

```
kabbolens/
├── docker-compose.yml
├── backend/
│   └── main.go
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── LandingPage.jsx     ← Animated entry
        │   ├── Navbar.jsx
        │   ├── Hero.jsx
        │   ├── UploadZone.jsx      ← Film frame upload
        │   ├── ResultPanel.jsx     ← Output + narrator
        │   ├── HeritageMap.jsx     ← Map + Dadu + reverse search
        │   ├── ArchiveGrid.jsx     ← Story archive
        │   ├── MiroWorkspace.jsx   ← Miro board builder
        │   └── FloatingOrbs.jsx    ← Ambient lighting
        └── styles/
            └── globals.css
```

---

<div align="center">

*Kolkata is a city that holds time differently.*  
*Its lanes remember partition. Its trams carry a century.*  
*Kabbo.Lens gives every photograph a voice.*

<br/>


<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=d4a847&height=80&section=footer"/>

</div>
