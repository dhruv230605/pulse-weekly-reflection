# Pulse — Mood & Energy Tracker

> **A personal well-being tracker that turns a week of mood logs into a gentle, shareable story — built end-to-end by an AI agent running a disciplined engineering loop, not vibe-coded.**

Log your mood and energy throughout the day, tag what influenced them, and see patterns over time. The standout feature — **[Weekly Reflection](#weekly-reflection-retention-feature)** — reframes analytics as *care*: it's designed to help people gently notice patterns and keep coming back, with sensitivity guardrails throughout. Built as the seed project for the **From Vibe Coding to Agentic Engineering** workshop.

### At a glance

- **Retention feature, fully wired** — streaks, week-over-week momentum, adaptive prompts, and opt-in sharing, all connected UI→API→tests.
- **Two-sided sensitivity model** — the app is strict on its *own* words and gentle with the *user's*; the user's lowest day is never shared.
- **Test coverage** — 43 backend + 46 frontend tests, with `mypy` and `tsc` clean. Every change gates on four feedback loops.
- **Reproducible process** — the entire `.agents/skills` loop (`grill-me` → architecture review → PRD → tracer-bullet issues → `rubber-duck` → TDD) is documented and was re-run as a *review engine* that found and fixed a broken build on `main`. Artifacts live in `prd/` and `issues/done/`.

**Where to start:** run both servers ([Getting Started](#getting-started)), open the **Reflection** tab, mint a share link, then read [`backend/app/services/digest.py`](backend/app/services/digest.py) — the entire feature's logic in one pure, testable module.


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

### 6. Continuous review & refinement (the loop, run *again* on finished code)

The same loop is also a **review engine**, not just a build engine. We re-ran it over the already-shipped Weekly Reflection feature to harden it:

1. **Baseline** — ran all four feedback loops first. This immediately caught that `mypy` was **red on `main`** (a redefined local in `digest.py`) — i.e. the "four green loops" invariant wasn't actually holding.
2. **`grill-me`** — the agent interviewed the human one question at a time and resolved **5 design branches**, each with a recommendation. The non-obvious calls:
   - The sensitivity filter was *too aggressive on the user's own words* — it hard-rejected a share if the user wrote "I felt **anxious** but pushed through" or "I **should** rest more". We split it: a strict list for the **app's own narrative**, a narrow abuse/slur net for **user-authored** text.
   - Sharing a digest was **broadcasting the user's lowest day** to the recipient. We strip `worst_day` from shared snapshots (it stays in the private view).
   - The streak mixed **local** `date.today()` with **UTC** entry dates → off-by-one near midnight. Now UTC-consistent.
   - Removed a dead caching subsystem + an unused helper that added surface area and lied about how the app works.
3. **architecture review (`improve-codebase-architecture`)** — confirmed `services/digest.py` is already a healthy **deep module** (pure, I/O-free, fully testable); the only friction was one concept ("what's safe to emit") smeared across two call sites. The split *deepened* that seam.
4. **`rubber-duck`** — an independent critique pass before implementing caught three blind spots a human would likely miss: a test fixture that monkeypatched the about-to-be-deleted constant, an existing test invalidated by the new policy, and the need to strip `worst_day` on **read** too (for links minted before the change). All adopted.
5. **`tdd`** — implemented as 5 thin vertical slices (`issues/001`–`005`, now in `issues/done/`), each red→green, ending with **all four loops green**.

**Quality bar — every change lands only when all four feedback loops are green:**

| Loop | Tool | Before refinement | After |
|------|------|-------------------|-------|
| Backend tests | `pytest` | 36 ✅ | **43 ✅** (+7 invariant tests) |
| Backend types | `mypy` | ❌ **red on main** | **✅ clean** |
| Frontend tests | `vitest` | 46 ✅ | **46 ✅** |
| Frontend types | `tsc` | ✅ | **✅** |

> Re-running the loop didn't just *add* a feature — it **found a broken build on `main` and a guardrail that was silently rejecting users' honest words about their own feelings**, then fixed both with tests to lock them in.

## What's Already Built

- Quick mood + energy logging (emoji scale + 1–10 slider + optional note)
- Tagging system (predefined tags: sleep, exercise, caffeine, meetings, commute, social + custom)
- Daily and weekly timeline view (line charts for mood & energy over time)
- Calendar heatmap (color-coded days by average mood)
- Entry history (scrollable, filterable list of past logs)

## Weekly Reflection (Retention Feature)

> Pulse takes a week of raw mood/energy logs and turns them into a *gentle, shareable story* — analytics reframed as **care**. The goal isn't more data; it's helping someone notice their own patterns and want to come back.

Available from the **Reflection** tab. Every piece of logic lives in one pure, fully-tested module (`backend/app/services/digest.py`) behind a small interface — a **deep module** (lots of behaviour, minimal surface).

### Feature catalogue (everything implemented)

| # | Feature | What it does | Where |
|---|---------|--------------|-------|
| 1 | **Logging streak** | Consecutive-day "don't break the chain" counter with a **one-day grace** (logging yesterday keeps the streak alive). Computed in **UTC** so it never flickers at midnight. | `compute_logging_streak` |
| 2 | **Week-over-week momentum** | Compares this week's avg mood to last week's and renders a gentle phrase ("Up 12% — nice momentum" / "About the same — steady is good" / "A gentler week than last — that's okay"). Suppressed unless **both** weeks have ≥2 entries, so it never over-claims on thin data. | `compute_week_over_week` |
| 3 | **Adaptive reflection prompt** | The question itself changes with the week: celebratory after a bright week, *supportive* after a hard one ("What helped you get through it?"), encouraging when entries are sparse. A low week is **never** asked "what would you do differently?". | `select_reflection_prompt` |
| 4 | **Tone-safe narrative engine** | Deterministic, template-based weekly summary (no LLM, always succeeds) that adapts to four data **buckets** — `empty` / `sparse` (≤2) / `partial` (≤6) / `full` — and three **qualities** (`great` / `mixed` / `rough`). | `build_digest` + `_render_template_narrative` |
| 5 | **Best-day highlight w/ smart signal** | Surfaces the week's brightest day. When mood is flat but energy varies a lot, it automatically **switches the highlight to energy** so the callout is still meaningful. | `highlight_signal` logic |
| 6 | **Lowest-day, private only** | A `worst_day` is computed for the owner's private view, but is **stripped from every shared snapshot** (at mint *and* on read). The person you share with never sees your hardest day. | route strips `worst_day` |
| 7 | **Day-by-day breakdown** | Always-7-day Mon–Sun grid with per-day mood/energy, top tags, and a tone-matched comment ("Monday asked a lot of you. You still showed up to log it — that matters."). | `day_breakdown` |
| 8 | **Mood trend** | Least-squares slope over the week labelled `improving` / `flat` / `declining` (only when there are ≥3 logged days). | `_trend_slope` / `_trend_label` |
| 9 | **Opt-in, read-only sharing** | Mint a tokenised link to a *snapshot* (not live data). Includes optional sender name + note. Links carry `x-robots-tag: noindex, nofollow` and **auto-expire after 30 days**. | `POST /digest/weekly/share` |
| 10 | **Partial-day sharing** | Share only selected days of the week via `include_days` — useful when only part of the week is something you want to show. | `include_days` query |
| 11 | **Private reflections** | The user's written reflection is stored client-side and is **never** included in a share unless they explicitly opt in (`include_reflection`). | `reflection_to_store` |
| 12 | **Revoke any share** | `DELETE /digest/share/{token}` instantly kills a link. | revoke route |

### 🛡️ Sensitivity guardrails

Mental-wellbeing data is among the most sensitive data a product can hold. The guardrails are deliberately **two-sided**:

- **The app polices its *own* voice, strictly.** `DENY_WORDS` (e.g. *worst, burnout, anxious, should, must*) are scrubbed from app-generated narrative so Pulse never labels a hard week "your worst" or hands out clinical/prescriptive language.
- **The app does *not* police the user's feelings.** Ordinary emotional vocabulary about your own week — "I felt **anxious** but pushed through", "I **should** rest more" — is **yours to share**. The earlier build wrongly hard-rejected these; we fixed it.
- **User-authored shared text is screened only for *recipient harm*.** A narrow `ABUSIVE_WORDS` net (slurs/harassment) with **word-boundary matching** (so "skill" ≠ "kill", "classic" is fine) blocks abuse aimed at the person you're sharing with — nothing more.
- **Your lowest day is private by construction** — stripped from shared snapshots at mint and again on read (defence in depth for old links).
- **Sharing is opt-in, snapshot-based, noindex, and expiring.** Nothing is shared by default; links can't be crawled and die after 30 days.

> The design principle in one line: *be strict with the machine's words, gentle with the human's.*

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
# one-time: dev/test tooling (not needed to run the app)
pip install pytest mypy httpx

python -m pytest -q          # 43 tests
python -m mypy app           # type checking — clean
```

### Frontend Tests

```bash
cd frontend
npm test -- --run              # 46 Vitest tests (non-watch mode)
npx tsc --noEmit               # type checking — clean
```

> **The quality gate:** a change is only "done" when **all four** loops are green — `pytest`, `mypy`, `vitest`, `tsc`.

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
│   ├── storage_digest.py   # Read-only share-token snapshots (30-day TTL)
│   └── seed.py             # Sample data generator
├── prd/                    # Product Requirement Docs (e.g. weekly-reflection-refinements.md)
├── issues/                 # Tracer-bullet issues (done/ holds completed slices 001–005)
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
