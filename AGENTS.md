# Execution-First Agent Guidelines (Canonical Rulebook)

> **ACTIVE MODE: MAIN-ONLY RAPID DEVELOPMENT**
> Follow the user's latest direct task immediately without roadmap gatekeeping, heavy documentation overhead, or unnecessary pre-checks.

## 1. Branch & Git Workflow (MAIN ONLY)
- **`main` is the ONLY development branch.**
- Never create, switch to, or develop on `dev`.
- All development, fixes, commits, and pushes happen directly on `main`.
- **Zero-Friction Direct Commits**: Commit and push directly to `main` without asking for permission for routine fixes.
- **Mandatory Pull-Before-Push Rule**: ALWAYS run `git pull --rebase origin main` before pushing to avoid conflicts.
- **Non-Destructive**: Never overwrite unrelated user work or discard unmerged changes.
- **NEVER Push Test Files / Test Suites**: Any AI agent MUST NEVER push test suites, mock test files, `__tests__`, `backend/SuperApp.API.Tests/`, `e2e/`, or test reports to remote. Keep test artifacts strictly local or ignored.
- **Do not push to VCS/GitLab**: Never push to internal VCS repository (`vcs.e-connectsolutions.com`).

## 2. Direct Execution & Rapid Development
- Follow the user's latest direct task immediately.
- Fix issues directly in code instead of preparing lengthy plans or audit reports.
- Do not proactively inspect unrelated files, `.github/workflows`, or git status unless required by the task.
- Do not read `ROADMAP.md`, `PENDING_FIXES.md`, or every file in `docs/` before starting.
- Read only the specific source files, callers, and configuration needed to implement the requested change.
- No multi-agent workflows, autonomous swarm gatekeeping, roadmap updates, or mandatory handoff reports.
- Do not ask whether the user wants to queue an issue or work on backlog items.
- Execute required actions autonomously without prompting ("Shall I proceed?", "Should I edit?").

## 3. Fast Targeted Verification
- Do not run full test suites, Expo Doctor, agent self-tests, or complete build pipelines by default.
- Use quick targeted checks only when needed to verify the specific code changed.
- Run broader tests only when explicitly requested or for high-risk changes.
- Never claim tests passed if they were not run.

## 4. Build Strategy & Expo OTA Updates
- **Local Native Builds**: Build APK/AAB locally on the development machine (`npx expo prebuild`, `./gradlew assembleRelease` / `bundleRelease`, or `eas build --local`).
- **No CI Minute Waste**: Automatic native Android builds on ordinary GitHub pushes are disabled; manual dispatch and release events remain available.
- **Expo OTA Updates**: Use EAS Update (`npx eas update --channel preview/production`) for JavaScript, TypeScript, UI styling, and compatible asset changes without compiling a new APK.
- **Native Changes Require New Build**: Changes to native dependencies, Android permissions (`AndroidManifest.xml`), native configuration, or Expo SDK upgrades require a new local APK/AAB build.
- Respect EAS plan limits and ensure runtime-version compatibility (`runtimeVersion: { policy: "appVersion" }`).

## 5. Security & Safety Boundaries
- **Production Guard**: Pushing to `main` automatically triggers Azure VM production deployment via `.github/workflows/deploy.yml`. Never push untested breaking changes to backend code.
- **Flutter Protection**: Do not modify Flutter source.
- **Credentials & Security**: Never expose credentials or copy secrets into logs or documentation. Fast execution must never bypass authorization, payment verification, or financial safeguards.
