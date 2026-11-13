# Fast Execution & Autonomous Authorization Guidelines

> **CANONICAL RULEBOOK**: This file defers completely to [AGENTS.md](./AGENTS.md).
> All AI agents must follow the unified guidelines defined in [AGENTS.md](./AGENTS.md).

## Quick Summary
1. **MAIN ONLY**: Direct execution on `main`; never create or use `dev`. Routine fixes, commits, and pushes require zero permission requests.
2. **Rapid Development**: Direct code fixes with targeted verification; no swarm gatekeeping, no redundant planning or full-suite testing.
3. **Local & OTA Builds**: Build APK/AAB locally; deploy JS/UI fixes via EAS OTA update; keep CI minutes free.
4. **Safety Boundaries**: Pull-before-push rebase; never push test files; preserve all payment, auth, and production deployment safeguards.
