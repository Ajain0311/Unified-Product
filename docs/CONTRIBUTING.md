# Contributor Guide: Unified Product

Welcome to `Unified Product`. This project is a feature-complete, modern platform fork of `SuperApp_V2` governed by the **Autonomous Engineering Swarm**.

## 1. Core Development Rules

1. **Feature Invariance First**:
   - Never remove or break existing endpoints, parameters, models, or workflows.
   - Any architectural refactoring must leave existing API consumers completely unimpacted.
2. **Clean Layered Placement**:
   - Pure domain rules -> `backend/SuperApp.Domain`
   - Business use-cases, orchestration & interfaces -> `backend/SuperApp.Application`
   - External gateways & EF Core implementations -> `backend/SuperApp.Infrastructure`
   - HTTP Controllers & Presentation -> `backend/SuperApp.API`
   - Unit & Integration Tests -> `backend/SuperApp.Tests`
3. **Autonomous Agent Governance**:
   - Features, bugfixes, and refactorings are coordinated through the 18-role engineering swarm skill (`autonomous-engineering-swarm`).

---

## 2. Local Environment Setup

### Prerequisites
- .NET 10.0 SDK (`dotnet --version` >= 10.0)
- Node.js >= 20.x (`node --version`)
- PostgreSQL 15+ (or run with in-memory / local connection string)

### Getting Started

1. **Clone & Setup Backend**:
   ```powershell
   cd "D:\Projects\Unified Product\backend"
   dotnet restore SuperApp.sln
   dotnet build SuperApp.sln
   dotnet test SuperApp.sln
   ```

2. **Run Backend API**:
   ```powershell
   cd "D:\Projects\Unified Product\backend\SuperApp.API"
   dotnet run
   ```
   API runs at `https://localhost:5001` or `http://localhost:5000` with Swagger available at `/swagger`.

3. **Frontend Mobile App**:
   ```powershell
   cd "D:\Projects\Unified Product"
   npm install
   npx expo start
   ```

---

## 3. Working with Autonomous Engineering Swarm

When developing features in this project:
- Trigger the `autonomous-engineering-swarm` skill.
- The **Business Analyst** verifies requirements and edge cases.
- The **Thought Engineer** suggests technical optimizations.
- The **UI/UX Design Engineer** plans interface layouts, empty/loading/error states.
- The **Testing Engineer** ensures test coverage in `SuperApp.Tests`.
- Commit with conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
