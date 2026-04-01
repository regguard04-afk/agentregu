# Regulatory Intelligence Agent — Frontend

A React-based dashboard that displays live outputs from an AI agent system for regulatory compliance monitoring. Built with React + Vite for fast development.

---

## What This Frontend Does

This dashboard connects to a Python backend running on Amazon Bedrock + CrewAI and displays:

- **Regulatory Updates Feed** — Live list of regulatory changes from sources like RBI, SEC, GDPR
- **Impact Analysis** — Detailed breakdown of each update's impact on your organization
- **Affected Controls & Gaps** — Which internal controls are affected and where gaps exist
- **Action Plans** — Prioritized tasks with owners, deadlines, and evidence requirements
- **Prediction Signals** — Early warning indicators for upcoming regulatory changes
- **AI Chatbot** — Ask questions about updates, controls, and actions in natural language

---

## Folder Structure

```
frontend/
├── public/                      # Static assets (favicons, images)
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx           # Top bar with branding + Run Analysis button
│   │   ├── UpdatesFeed.jsx      # Left panel: card list + filters + search
│   │   ├── ImpactAnalysis.jsx   # Right panel: full detail of selected update
│   │   ├── ControlMapping.jsx   # Table of affected controls + gap warnings
│   │   ├── ActionPlan.jsx       # Priority-sorted task cards
│   │   ├── ChatBot.jsx          # Floating AI chat panel
│   │   ├── PredictionSignals.jsx# Early warning signals card
│   │   ├── UrgencyBadge.jsx     # Colored badge: critical/high/medium/low
│   │   ├── StatusBadge.jsx      # Colored badge: new/in_review/actioned/closed
│   │   └── PipelineStatus.jsx   # Live status indicator (polls every 5s)
│   ├── pages/
│   │   └── Dashboard.jsx        # Main page that assembles all components
│   ├── services/
│   │   ├── dataService.js       # ALL backend API calls (centralized)
│   │   └── chatService.js       # Chat-specific API calls
│   ├── config/
│   │   └── settings.js          # API URL configuration (only file to edit)
│   └── styles/
│       └── main.css             # Complete stylesheet (all styles in one file)
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite dev server configuration
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites

- **Node.js** (version 16 or higher) — [Download here](https://nodejs.org)
- **npm** (comes with Node.js)

### Install & Run

Open a terminal in the `frontend/` folder and run:

```bash
# 1. Install all dependencies
npm install

# 2. Start the development server
npm run dev
```

The app will open automatically at **http://localhost:5173**

### Connect to Backend

The frontend expects the backend to be running at `http://127.0.0.1:8000`.

If your backend runs on a different URL, edit **one file**:

```
src/config/settings.js
```

Change the `apiBaseUrl` value:

```js
const CONFIG = {
  apiBaseUrl: "http://your-backend-url:port"
};
```

---

## Which File Controls What

| File | Purpose |
|------|---------|
| `settings.js` | API URL — the only config file to edit |
| `dataService.js` | All API calls (getUpdates, triggerAnalysis, etc.) |
| `chatService.js` | Chat endpoint API call |
| `main.css` | All styles — colors, layout, animations |
| `Dashboard.jsx` | Main page layout — assembles all sections |
| `Header.jsx` | Top bar with Run Analysis button |
| `UpdatesFeed.jsx` | Left panel with update cards and filters |
| `ImpactAnalysis.jsx` | Right panel detail view |

---

## UI Sections Explained

### 1. Header Bar
- Shows project name and logo
- **Run Analysis** button triggers the AI pipeline (POST /api/analyze)
- **Pipeline Status** indicator polls the backend every 5 seconds
  - Gray = Idle, Blue + spinner = Running, Green = Done, Red = Error

### 2. Regulatory Updates Feed (Left Panel)
- Lists all regulatory updates as clickable cards
- Each card shows: title, source, jurisdiction, date, urgency badge
- **Search bar** filters by keyword in title/summary
- **Dropdown filters** for jurisdiction, urgency level, and topic
- Auto-refreshes every 30 seconds

### 3. Impact Analysis (Right Panel)
- Shown when you click an update card
- Full summary, obligations list, relevance score bar
- Urgency badge, jurisdiction/topic tags
- Published date and source link

### 4. Affected Controls & Gaps
- Table showing Control ID, Control Name, Policy Name
- Red warning boxes for each identified control gap
- Green "No gaps found" message when everything is covered

### 5. Action Plan
- Task cards sorted by priority (P1 → P2 → P3)
- Each card shows: task description, owner, deadline, evidence required
- Color-coded left border: P1=red, P2=orange, P3=blue

### 6. Prediction Signals
- Amber-themed card with bullet list of early warning signals
- Only appears when prediction signals exist for the selected update

### 7. AI Chatbot
- Floating button in the bottom-right corner
- Click to open the chat panel
- Suggested questions appear when chat is empty
- Shows AI answers with source citations
- Loading dots animation while waiting for response

---

## Troubleshooting

### 1. "Cannot connect to backend" error
**Cause:** The backend is not running.  
**Fix:** Start the backend first:
```bash
cd backend && python main.py
```

### 2. Blank page / white screen
**Cause:** Dependencies not installed.  
**Fix:** Run `npm install` in the `frontend/` folder, then `npm run dev`.

### 3. CORS errors in browser console
**Cause:** The backend doesn't allow requests from localhost:5173.  
**Fix:** Add CORS middleware to your backend. For FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

### 4. "Module not found" errors
**Cause:** Missing dependency.  
**Fix:** Delete `node_modules/` and `package-lock.json`, then run `npm install` again:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 5. Port 5173 already in use
**Cause:** Another process is using port 5173.  
**Fix:** Either stop that process, or change the port in `vite.config.js`:
```js
server: { port: 3000 }
```

---

## Tech Stack

- **React 18** — UI library
- **Vite 5** — Build tool and dev server
- **Lucide React** — Icon library
- **Plain CSS** — No frameworks, just clean CSS with custom properties
- **Inter** — Google Font for typography

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
