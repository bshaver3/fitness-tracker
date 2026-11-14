# Squad Team

> FitTrack web app: product scope, UX, React UI for logging, insights and recommendations

## Coordinator

| Name | Role | Notes |
|------|------|-------|
| Squad | Coordinator | Routes work, enforces handoffs and reviewer gates. |

## Members

| Name | Role | Charter | Status |
|------|------|---------|--------|
| Lead | Lead / Architect | `.squad/agents/lead/charter.md` | ✅ Active |
| Product | Product Manager | `.squad/agents/product/charter.md` | ✅ Active |
| Designer | UI/UX Designer | `.squad/agents/designer/charter.md` | ✅ Active |
| Frontend | Frontend Developer | `.squad/agents/frontend/charter.md` | ✅ Active |
| Tester | Test Engineer | `.squad/agents/tester/charter.md` | ✅ Active |
| Docs | Technical Writer | `.squad/agents/docs/charter.md` | ✅ Active |

## Project Context

- **Owner:** Brendan
- **Squad:** fittrack-frontend
- **Project:** FitTrack: a website that tracks each user's workouts, calories and food intake, then suggests attainable workouts and diet plans based on their fitness goals and physique.
- **This repo:** React web app (Create React App), hosted on AWS Amplify + CloudFront.
- **Stack:** React 19, react-router 7, plain JavaScript (no TypeScript), Amplify v6 auth (Cognito), axios (`src/api.js`), Chart.js via react-chartjs-2, design tokens in `src/index.css` and `src/App.css`.
- **Peer squad:** `fittrack-backend` at `../fitness-backend` (registered in `.squad/squad-registry.json`)
- **Shared context:** upstream `fittrack-shared` (parent folder `.squad/`): shared decisions, routing rules and the `fe-be-contract` skill
- **Created:** 2026-11-14
