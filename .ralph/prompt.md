# ISSUES

Local issue files from `issues/` are provided at start of context. Parse them to understand the open issues.

You will work on the AFK issues only (label `afk`), not the HITL ones (label `hitl`).

Also review the recent git log to understand what work has been done.

If all AFK tasks are complete, output <promise>NO MORE TASKS</promise>.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure

Getting development infrastructure like tests and types and dev scripts ready is an important precursor to building features.

3. Tracer bullets for new features

Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

4. Polish and quick wins
5. Refactors

# EXPLORATION

Explore the repo.

# BRANCH SETUP

Before implementing anything, check the current branch and ensure it is clean and up to date.

```sh
git branch --show-current
git status
git pull
```

**If there are uncommitted changes:** Stop immediately. Inform the user about the uncommitted changes and ask them to resolve it (commit, stash, or discard) before re-running.

**If the working tree is clean:** Continue with implementation on the current branch.

# IMPLEMENTATION

Use /tdd to complete the task.

Apply TDD to **both** the Python backend and the React frontend.

## Backend (Python)

- Write tests in `backend/tests/` using `pytest`.
- Run with `backend/.venv/Scripts/pytest` from the repo root (always inside the backend virtual environment).

## Frontend (React + Vite + TypeScript)

- Testing framework: **Vitest** (built-in Vite integration, no extra config needed).
- Component/DOM testing: **React Testing Library** (`@testing-library/react` + `@testing-library/user-event`).
- JSDOM environment: add `@testing-library/jest-dom` for matcher extensions.
- Test files live in `frontend/tests/` (e.g. `frontend/tests/App.test.tsx`). Name them after the module they cover.
- Run frontend tests with `npm test` (or `npx vitest run`) from the `frontend/` directory.
- Follow the same red → green → refactor loop: write a failing component/hook test first, then implement the feature, then clean up.

# FEEDBACK LOOPS

Before committing, run all feedback loops:

**Backend:**
- `cd backend && .venv/Scripts/pytest` to run Python tests
- `cd backend && .venv/Scripts/mypy .` to run the type checker

**Frontend:**
- `cd frontend && npm test -- --run` to run Vitest tests (non-watch mode)
- `cd frontend && npx tsc --noEmit` to type-check TypeScript

# COMMIT

Make a git commit. The commit message must:

1. Include key decisions made
2. Include files changed
3. Blockers or notes for next iteration

# FINISHING UP

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

# CONSTRAINTS

- Only read, write, or execute files within the repository root. Never access paths outside it.
- Do not install packages globally or modify anything outside the repo (no system config, no other directories).
- All Python commands (`pytest`, `mypy`, package installs) must run inside the backend's virtual environment (`backend/.venv/`). Never use the system Python.
- All frontend commands (`npm test`, `npx tsc`) must run from the `frontend/` directory.

# FINAL RULES

- ONLY WORK ON A SINGLE TASK
- DO NOT USE SUBAGENTS
- DO NOT ASK ANY QUESTIONS