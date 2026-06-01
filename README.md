# Pulse — Mood & Energy Tracker

A personal well-being tracker where you log your mood and energy levels throughout the day, tag what influenced them, and see patterns over time. Built as the seed project for the **From Vibe Coding to Agentic Engineering** workshop.

## What's Already Built

- Quick mood + energy logging (emoji scale + 1–10 slider + optional note)
- Tagging system (predefined tags: sleep, exercise, caffeine, meetings, commute, social + custom)
- Daily and weekly timeline view (line charts for mood & energy over time)
- Calendar heatmap (color-coded days by average mood)
- Entry history (scrollable, filterable list of past logs)

## Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | React + Vite + TypeScript     |
| Styling   | Tailwind CSS                  |
| Charts    | Recharts                      |
| Backend   | Python + FastAPI              |
| Storage   | File-based JSON (`.data/`)    |

## Getting Started

### Prerequisites

- Node.js v20+
- Python 3.10+
- npm

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

The API will be running at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

### 3. Seed Data (Optional)

To populate the app with sample data so charts look meaningful:

```bash
cd backend
python seed.py
```

---

## Testing

### Backend Tests

```bash
cd backend
.venv\Scripts\pytest          # run tests
.venv\Scripts\mypy app         # type checking
```

### Frontend Tests

```bash
cd frontend
npm test -- --run              # run Vitest tests (non-watch mode)
npx tsc --noEmit               # type checking
```

---

## Project Structure

```
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/          # Dashboard, LogEntry, History
│   │   ├── components/     # Reusable UI components
│   │   └── lib/            # API client, types
│   └── tests/              # Vitest + React Testing Library tests
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   └── models/         # Pydantic models
│   ├── tests/              # pytest tests
│   ├── storage.py          # File-based JSON storage
│   └── seed.py             # Sample data generator
├── briefs/                 # Feature request briefs for the workshop
│   ├── 01-correlation-insights.md
│   ├── 02-weekly-reflection.md
│   ├── 03-smart-nudges.md
│   ├── 04-team-pulse.md
│   └── 05-mood-aware-planner.md
└── README.md
```

---

## Workshop: Feature Briefs

The `briefs/` folder contains 5 feature requests written as messages from a fictional product lead. During the workshop:

1. **The presenter** will demo building one feature (Brief #1: Correlation Insights) using the agentic engineering flow
2. **Attendees** pick any of the remaining briefs (or invent their own) and follow the same flow

Each brief is designed to produce a rich grilling/design session with non-obvious decisions.

---

## API Reference

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| POST   | `/api/entries`            | Create a new mood/energy entry  |
| GET    | `/api/entries`            | List entries (optional filters) |
| GET    | `/api/entries/{id}`       | Get a single entry              |
| DELETE | `/api/entries/{id}`       | Delete an entry                 |
| GET    | `/api/stats/daily`        | Daily averages (last 14 days)   |
| GET    | `/api/stats/weekly`       | Weekly averages (last 8 weeks)  |
| GET    | `/api/stats/heatmap`      | Calendar heatmap data           |
| GET    | `/api/tags`               | List all available tags         |

---

## Inspiration

This repository and workshop have been heavily inspired by [Matt Pocock's AI Engineer Workshop](https://github.com/mattpocock/ai-engineer-workshop-2026-project/).
