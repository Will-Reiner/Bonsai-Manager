# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bonsai Manager is a full-stack bonsai plant management application with a Node.js/Express backend and a React Native/Expo mobile frontend. The project language (code comments, UI, docs) is **Portuguese**.

## Commands

### Backend (server/)

All server commands run from `server/` or via Docker.

```bash
# Start backend + PostgreSQL (from project root)
docker compose up --build

# Run all tests
cd server && npm test

# Run tests for a specific module
cd server && npm test -- especie

# Run a single test file
cd server && npm test -- create-especie.use-case.test.ts

# Watch mode
cd server && npm run test:watch

# Coverage report
cd server && npm run test:coverage

# Dev server (outside Docker, requires local DB)
cd server && npm run dev

# Prisma commands
cd server && npm run prisma:generate
cd server && npm run prisma:migrate:dev
docker compose exec api npx prisma studio   # visual DB editor on port 5555
```

### Frontend (mobile_app/)

```bash
cd mobile_app && npm install
cd mobile_app && npx expo run:android    # if there's new dependencies
cd mobile_app && npx expo start          # Metro Bundler
cd mobile_app && npm run android
cd mobile_app && npm run ios
cd mobile_app && npm run web
```

**Important**: Before running on a physical device, update the API base URL in `mobile_app/src/api/index.ts` to your local machine's IP address.

## Architecture

### Backend — Clean Architecture with Use Cases

The server follows a layered Clean Architecture. Each feature is a self-contained module under `server/src/modules/{moduleName}/`:

```
controllers/   → HTTP handlers (parse request, call use case, return response)
schemas/       → Zod validation schemas for request data
use-cases/     → Business logic classes (one class per action)
               → Co-located test files (*.use-case.test.ts)
repositories/  → Prisma data access (implements repository interface)
*.types.ts     → DTOs and repository interfaces
```

**Data flow**: Request → Controller → Schema validation → Use Case → Repository → Prisma → PostgreSQL

**Key conventions**:
- Use cases accept repository interfaces via constructor injection, making them testable with mocks
- Tests use the AAA pattern (Arrange-Act-Assert) with mocked repositories — no database needed
- Test setup in `server/src/test/setup.ts` globally mocks PrismaClient
- Controllers must NOT contain business logic; all domain rules live in use cases
- The `@/` path alias maps to `server/src/` (configured in tsconfig and jest)

### Middleware

- `server/src/middlewares/auth.middleware.ts` — JWT verification, attaches `req.user.userId`
- `server/src/middlewares/admin.middleware.ts` — Requires `ADMIN` role

### Database

- Schema defined in `server/prisma/schema.prisma` (~18 models)
- Key enums: `Role` (USER/ADMIN), `AgendaStatus`, `ModoAquisicao`, `Estacao`, `TipoPlanta`, `UnidadeMedida`
- Migrations applied automatically by `server/entrypoint.sh` on Docker startup

### Frontend — React Native + Expo

```
mobile_app/
├── App.tsx                        # Root: AuthProvider → AppNavigator
├── src/
│   ├── api/index.ts               # Axios instance with JWT token injection
│   ├── context/AuthContext.tsx     # Global auth state (React Context + AsyncStorage)
│   ├── navigation/AppNavigator.tsx # Stack + bottom tab navigation
│   ├── screens/                   # Screen components (auth, app, admin)
│   ├── components/                # Shared UI components
│   ├── constants/theme.ts         # Color palette, spacing, typography
│   ├── services/                  # API interaction helpers
│   └── types/index.ts             # TypeScript types mirroring backend DTOs
```

Navigation structure: unauthenticated users see Login/Register; authenticated users get a bottom tab navigator with Collection, Agenda, Inventory, Encyclopedia, Community, and Profile tabs. Admin users additionally see an admin panel.

### Infrastructure

- `docker-compose.yml` orchestrates PostgreSQL (port 5432) and the API (port 3000)
- API container mounts `./server` for hot-reloading via ts-node-dev
- Swagger docs available at `http://localhost:3000/api/docs` when server is running

## Adding a New Backend Module

1. Create the module directory under `server/src/modules/{name}/`
2. Define types/DTOs in `{name}.types.ts` and repository interface
3. Write use case tests first (TDD approach — the project follows Red-Green-Refactor)
4. Implement use cases, repository (Prisma), controller, schemas, and router
5. Register the router in `server/src/server.ts` under the `/api` prefix
6. Add Prisma model to `schema.prisma` and run migrations if needed

## commands

- eas build --platform android --profile preview na pasta /mobile_app para gerar o apk 

## TODO

- Species suggestion - DONE
- Midia storage management - DONE
- Improve error logs for api
- Add photos while creating a plant - DONE
- Virtual styling for future vision - DONE
- Lack of recurrence on the events
- Register multiple tasks
- Onboarding questions for especification - DONE/precisa melhorar