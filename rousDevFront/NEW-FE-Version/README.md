# ENT EST Sale - Frontend Prototype

Frontend-only modern university ENT platform built with React + TypeScript + Vite.

## Chosen stack

- React 19 + TypeScript
- Vite (fast local development and build)
- React Router (multi-page frontend navigation)
- Lucide React (modern icon set)
- Mock data only (`src/data/mockData.ts`)

## Design system

The design system is defined in `src/index.css`:

- **Color palette**
  - Primary: `#1f6feb`
  - Background: `#f4f7fc` / card: `#ffffff`
  - Text main: `#1f2a44` / muted: `#6b7891`
  - Accent: `#f59e0b`
- **Typography**
  - Inter / Segoe UI / Roboto fallback stack
  - Clear hierarchy for page titles and card headers
- **Spacing**
  - Tokenized spacing (`--space-1` to `--space-7`)
- **Layout strategy**
  - Sidebar + topbar dashboard shell
  - Reusable card-grid pattern
  - Responsive breakpoints for tablet/mobile
- **Reusable components**
  - `Card`, `PageHeader`, `Badge`, `SearchField`
  - `EmptyState`, `LoadingState`, `ErrorState`

## Pages/modules included

- Authentication: login, forgot password, account validation, help
- Dashboard home widgets
- Courses: list, details, upload
- Documents: library, filters, upload/download UI
- Messaging: inbox, notifications, chat
- Calendar: events, weekly timetable, exam schedule
- Forum: topics, thread, AI/support assistant
- Exams & assignments: exams, submissions, grades
- Profiles: student, teacher, admin, edit profile
- Admin: users, roles, statistics, system overview

## Role simulation

Mock role switching is available in topbar:

- Student
- Teacher
- Admin

## Project structure

```text
src/
  components/ui.tsx
  context/AppContext.tsx
  data/mockData.ts
  layouts/DashboardLayout.tsx
  pages/AuthPages.tsx
  pages/ModulePages.tsx
  routes/router.tsx
  types/index.ts
  index.css
  main.tsx
```

## Run locally

```bash
npm install
npm run dev
```

## Run with Keycloak login (Docker)

This repository now includes an auto-imported Keycloak realm for development.

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Auth API health: `http://localhost:8000/health`
- Keycloak admin: `http://localhost:8080` (`admin` / `admin`)

Demo login users (password: `ChangeMe123!`):

- `student@estsale.ma` -> STUDENT
- `teacher@estsale.ma` -> TEACHER
- `admin@estsale.ma` -> ADMIN

If you previously started Keycloak with an existing volume/container, remove it first so realm import is applied:

```bash
docker compose down -v
docker compose up --build
```

Build production bundle:

```bash
npm run build
```

## Where to edit later

- Update mock content: `src/data/mockData.ts`
- Update branding + dashboard labels quickly: `src/config/content.ts`
- Add/edit pages: `src/pages/AuthPages.tsx`, `src/pages/ModulePages.tsx`
- Change navigation/routes: `src/routes/router.tsx`, `src/layouts/DashboardLayout.tsx`
- Adjust design/theme/tokens: `src/index.css`
- Update app state logic (auth/roles): `src/context/AppContext.tsx`
