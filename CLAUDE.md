# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

React frontend ("FitTrack") for a workout tracker. The FastAPI backend lives in a sibling repo at `../fitness-backend` (GitHub `bshaver3/Fitness-backend`) and has its own CLAUDE.md.

## Commands

```bash
npm start                                   # dev server on :3000 (uses .env.development → API at localhost:8000)
REACT_APP_MOCK_AUTH=true npm start          # skip Cognito; pair with backend LOCAL_MOCK=true
npm run build                               # production build → build/
npm test                                    # Jest watch mode (react-scripts)
CI=true npm test -- src/App.test.js         # single file, run once
CI=true npm test -- -t "test name"          # single test by name
```

Linting is CRA's built-in ESLint (`react-app` config), reported by `npm start`/`npm run build`. There is no formatter. `src/App.test.js` is the stale CRA default ("learn react") and currently fails.

Claude Code hooks (`.claude/settings.json`) block edits to `.env*`, `package-lock.json`, `amplify/`, `src/aws-exports.js`, `src/amplifyconfiguration.json`, `build/`, and `node_modules/`; edits to `amplify.yml` require confirmation.

## Architecture

Create React App (react-scripts 5), React 19, react-router 7, Amplify v6 (modular `aws-amplify/auth` imports), axios, Chart.js via react-chartjs-2. Plain `.js`, no TypeScript; styling is mostly inline style objects.

**Auth flow** — three files work together:
- `index.js` calls `Amplify.configure(aws-exports)` unless mock auth is on.
- `AuthContext.js` exposes `user`, `loading`, `profileComplete`, and sign-in/up/out wrappers through `useAuth()`. After a user is found it calls `GET /profile`; the profile counts as complete only if `height_feet`, `current_weight`, and `age` are set.
- `ProtectedRoute.js` sends users with no session to `/login`, and users with an incomplete profile to `/profile`. That is how first-time users are forced through profile setup; call `refreshProfileStatus()` after saving the profile.

**API layer** — all backend calls go through the axios instance in `src/api.js`:
- The base URL is `REACT_APP_API_BASE`: `.env.development` → `http://localhost:8000`, `.env.production` → API Gateway.
- A request interceptor attaches the Cognito **ID token** (not the access token) as `Authorization: Bearer`. The backend validates `aud` against the app client ID, which only ID tokens carry.
- Any 401 response hard-redirects to `/login`.

**Mock auth (`REACT_APP_MOCK_AUTH=true`)** is checked separately in `index.js`, `api.js`, and `AuthContext.js`. It fakes a `local-dev-user` session and sends no token, so it only works against a backend running with `LOCAL_MOCK=true`.

**Pages** — `Home` (log workouts, complete planned workouts), `Goals` (CRUD for planned workouts), `Insights` (charts), `Profile`, `Login`, `Signup`. Home and Insights both read `GET /insights/comprehensive`, which is computed server-side. Chart.js components are registered once in `App.js`; new chart types must be added to that `ChartJS.register(...)` call.

## Config & deployment

- Hosted on AWS Amplify (app `main.d20be68lg9xm5h.amplifyapp.com`). `amplify.yml` runs `npm ci && npm run build` and defines the HTTP security headers.
- **The CSP in `amplify.yml` whitelists `connect-src`** to `self`, `*.execute-api.us-east-1.amazonaws.com`, and Cognito endpoints. Calling any new external origin from the browser requires updating it, or the call is blocked in production only.
- `src/aws-exports.js` (Cognito user pool `us-east-1_fAO8zL6Gx`, SPA app client) is committed on purpose. `src/amplifyconfiguration.json` and the `amplify/` directory are Amplify CLI–generated (hosting only); don't hand-edit them.
- The backend's CORS allowlist contains only `http://localhost:3000` and the Amplify domain.
