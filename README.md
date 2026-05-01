# IntelliLearn (Merged Workspace)

This repository currently contains 3 folders, but the active app stack is now:

- Main frontend: `Intellilearn(FRONTEND)`
- Main backend: `intellilearn-backend`
- Legacy reference project: `AI Tutor` (used as source during migration)

## Current Main Architecture

- Frontend: React + Vite + Tailwind
- Backend: FastAPI
- Database/Auth: Firebase (Firestore + Google auth via Firebase token verification)
- AI provider priority: Groq first, OpenAI fallback

## What has been implemented so far

- MongoDB-based backend code migrated to Firestore usage.
- Google login integrated:
  - Frontend Firebase popup login
  - Backend `/api/auth/google-login` token verification and JWT issuing
- Profile settings backend sync:
  - `PUT /api/user/profile`
  - Local and backend profile state updates
- Tutor page wired to backend chat APIs:
  - `POST /api/chat/ask-ai`
  - `GET /api/chat/sessions`
  - `GET /api/chat/sessions/{id}`
  - `POST /api/chat/sessions`
  - `DELETE /api/chat/sessions/{id}`
  - `PUT /api/chat/sessions/{id}/title`
  - `POST /api/chat/sessions/{id}/title/auto`
- Tutor UX updates:
  - Dark/light mode support
  - Session list and new chat flow
  - Auto title flow for new sessions
  - Auto logout/redirect on token expiry (401)

## Main folders: what to run

### 1) Backend (`intellilearn-backend`) - main API

From root:

```bash
cd "intellilearn-backend"
```

Create venv once (if needed):

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Run backend:

```bash
.venv/bin/python main.py
```

Health check:

```bash
curl http://localhost:8000/api/health
```

### 2) Frontend (`Intellilearn(FRONTEND)`) - main UI

From root:

```bash
cd "Intellilearn(FRONTEND)"
npm install
npm run dev
```

Default local URL:

- `http://localhost:5173` (or 5174 if 5173 is in use)

## Required environment variables

### Backend: `intellilearn-backend/.env`

Minimum required:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CREDENTIALS_PATH=./your-firebase-admin.json
FIREBASE_CREDENTIALS_JSON=
REDIS_URL=redis://localhost:6379

GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
OPENAI_API_KEY=
```

### Frontend: `Intellilearn(FRONTEND)/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
# Optional: lock admin access to one email
VITE_ADMIN_AUTHORIZED_EMAIL=
```

## Admin login setup (first admin)

Admin dashboard access is role-based from DB (`role=admin`).

1. Add these values in backend `.env`:

```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=Admin1234
ADMIN_NAME=Platform Administrator
```

2. Seed/update admin user in Firestore:

```bash
cd "intellilearn-backend"
.venv/bin/python scripts/seed_admin.py
```

3. Login from frontend with the same `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

If `VITE_ADMIN_AUTHORIZED_EMAIL` is empty, any backend-verified user with `role=admin` can access admin dashboard.

## Git hygiene (already configured)

Env and generated artifacts are ignored via `.gitignore`:

- `.env` files
- `node_modules`
- `dist`
- firebase service account json

If a generated folder was previously tracked, untrack once:

```bash
git rm -r --cached <path>
```

## Important note

`AI Tutor` folder is still present for reference during migration.  
Target end state is a single production frontend (`Intellilearn(FRONTEND)`) and single backend (`intellilearn-backend`).

