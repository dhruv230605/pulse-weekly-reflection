# Pulse — Mood & Energy Tracker

A personal well-being tracker where you log your mood and energy levels throughout the day, tag what influenced them, and see patterns over time. Built as the seed project for the **From Vibe Coding to Agentic Engineering** workshop.

## How This Was Built — The Agentic Engineering Workflow

The **Weekly Reflection** feature wasn't vibe-coded. It was built with a disciplined, repeatable agentic workflow where the human stays in the loop on *intent* and the agent owns *execution*. These are the techniques that made up the core of the process:

### 1. Write a PRD (`write-a-prd`)
Every feature starts as a **Product Requirements Document**, not a prompt. The agent interviews the user, explores the codebase to verify assumptions, sketches **deep modules** (lots of functionality behind a simple, testable interface), then writes a structured PRD to `prd/` covering Problem, Solution, User Stories, Implementation Decisions, Testing Decisions, and Out-of-Scope. This pins down the retention goal and sensitivity guardrails *before a line of code*.

### 2. Grill Me (`grill-me`)
Before committing to a plan, the agent **relentlessly interviews the user** one question at a time, walking down every branch of the design tree and resolving dependencies between decisions. Anything answerable by reading the code is resolved by exploration instead of asking. This is where the non-obvious calls get made (e.g. "a hard week is framed gently, never 'your worst week'").

### 3. PRD to Issues (`prd-to-issues`)
The PRD is decomposed into **tracer-bullet issues** — thin *vertical slices* that cut end-to-end through every layer (schema, API, UI, tests), not horizontal layers. Each issue is independently demoable, labelled **AFK** (agent can finish autonomously) or **HITL** (needs a human decision), with explicit "Blocked by" dependencies. Issues live as local markdown files in `issues/`.

### 4. Ralph — the autonomous build loop (`.ralph/`)
**Ralph** is the loop that drives the agent through the AFK issues unattended. Each iteration it: reads the open issues, picks the next task by priority (bugfixes → infra → tracer bullets → polish → refactors), checks out a clean branch, implements with **TDD**, runs **all four feedback loops** green (`pytest`, `mypy`, `vitest`, `tsc`), commits with decisions recorded, then moves the issue to `issues/done/`. Constrained to the repo, one task at a time, no subagents, no questions.

### 5. TDD + deep modules (`tdd`, `improve-codebase-architecture`)
Implementation follows **red → green → refactor** on both backend (pytest) and frontend (Vitest + React Testing Library), testing external behavior through public interfaces — never private helpers. Logic is pushed into **deep, isolated modules** (e.g. the pure `services/digest.py`) that are easy to test and rarely change.

> **The loop in one line:** `write-a-prd` → `grill-me` → `prd-to-issues` → **Ralph** runs `tdd` per issue → feedback loops green → commit → `issues/done/`.

## What's Already Built

- Quick mood + energy logging (emoji scale + 1–10 slider + optional note)
- Tagging system (predefined tags: sleep, exercise, caffeine, meetings, commute, social + custom)
- Daily and weekly timeline view (line charts for mood & energy over time)
- Calendar heatmap (color-coded days by average mood)
- Entry history (scrollable, filterable list of past logs)

## Weekly Reflection (Retention Feature)

A retention-focused **Weekly Reflection** added on top of Pulse, built end-to-end with an AI coding agent. Available from the **Reflection** tab.

**What it does**

- **Logging streak**: a visible "don't break the chain" hook
- **Week-over-week momentum**: shows whether mood is improving, steady, or gentler (never harsh)
- **Adaptive reflection prompts**: supportive after hard weeks, celebratory after bright ones, encouraging when entries are sparse
- **Opt-in sharing**: read-only digest links; private reflections stay private unless explicitly shared, and all shared text passes a sensitivity filter

**Why it matters**

It reframes analytics as care: the goal isn't more data, it's helping people gently notice patterns and keep coming back.

**Sensitivity guardrails**

- A hard week is framed gently ("a gentler week than last, that's okay"), never "your worst week"
- Prompts after low-mood weeks are supportive, not corrective
- Private reflections are never shared unless explicitly opted in
- All shared text (notes + reflections) passes a deny-word filter

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
│   │   ├── pages/          # Dashboard, LogEntry, History, WeeklyReflection, SharedDigest
│   │   ├── components/     # Reusable UI components (incl. DigestCard)
│   │   └── lib/            # API client, types, reflectionAnswer (localStorage)
│   └── tests/              # Vitest + React Testing Library tests
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── routes/         # API endpoints (entries, stats, tags, digest)
│   │   ├── services/       # Pure digest logic (digest.py)
│   │   └── models/         # Pydantic models
│   ├── tests/              # pytest tests
│   ├── storage.py          # File-based JSON storage (entries)
│   ├── storage_digest.py   # Cached digests + share tokens
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
| GET    | `/api/digest/weekly`      | Weekly reflection digest (streak + momentum) |
| POST   | `/api/digest/weekly/share`| Mint a read-only share link     |
| GET    | `/api/digest/shared/{token}` | Public, read-only shared digest |
| DELETE | `/api/digest/share/{token}` | Revoke a share                |

---

## Inspiration

This repository and workshop have been heavily inspired by [Matt Pocock's AI Engineer Workshop](https://github.com/mattpocock/ai-engineer-workshop-2026-project/).
