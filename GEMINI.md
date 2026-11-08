# Fast Execution & Autonomous Authorization Guidelines

> **ACTIVE MODE: EXECUTION-FIRST & FAST CODING**
> Always prioritize instant execution on direct user tasks with zero unnecessary pre-checks or overhead.

## 1. Direct Execution & Zero Proactive Exploration (Strict)
- **Do not inspect unrelated files, `.github/workflows`, `scripts/`, or git status** unless explicitly requested.
- Read only the specific files directly relevant to the user's immediate request.
- No proactive multi-command audits, exploration chains, or background probing.
- Give direct answers and implement targeted changes immediately.

## 2. Zero Permission Requests
- Execute required actions autonomously without prompting ("Shall I proceed?", "Should I edit?").
- Target only the requested changes cleanly and report results when done.

## 3. Strict Safety & Push Boundaries
- Work on `dev` only. Never modify or merge into `main`.
- Do not modify Flutter source.
- Never push without pulling first (`git pull --rebase origin <branch>`).
- **NEVER push test suites or mock files** (`__tests__`, `backend/SuperApp.API.Tests/`, `e2e/`).
- Do not push to VCS/GitLab repository (`vcs.e-connectsolutions.com`).
