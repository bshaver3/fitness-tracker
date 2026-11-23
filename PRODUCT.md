# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brendan and a small circle of friends/family who each track their own workouts. Casual-to-serious gym-goers with mixed experience levels (the profile setup explicitly asks gym experience from beginner to expert). Primary device is a laptop/desktop, though the app must remain usable on a phone.

## Product Purpose

FitTrack lets a user log workouts, plan future ones, and track food intake against a daily calorie target, alongside progress toward their weekly workout goal. Success is a user who can quickly see what they have logged, whether they are on pace for their own targets, and what is still on their calendar.

## Positioning

Not a social fitness network and not a coached program — it's a personal log with a plan-ahead calendar and server-computed insights (streaks, week-over-week deltas, consistency stats) tailored to one person's own weekly target, not a leaderboard against others.

## Operating Context

- Sign in via Cognito (email/password, email verification code). A brand-new account is forced through Profile setup (height, weight, age required) before it can reach any other page.
- Workout loop: open Home → log a workout (type/duration/calories, calories auto-suggested from profile weight once type+duration are set) → see updated weekly progress, streak, and week-over-week comparison.
- Nutrition tracking (PRD below): log food and its calories → see the selected day's intake against a user-set daily calorie target. This is a personal log, not nutritional advice.
- Goals page: schedule future workouts (list or calendar view), and Home surfaces any planned workout whose date has passed unaddressed ("missed workouts") so the user can log it as done or dismiss it.
- Insights page: charts (frequency, calories over time, workout-type breakdown) plus consistency stats and weight-vs-target progress, all computed server-side.
- Used in short sessions — logging a workout right after training, or checking progress for a few seconds — so speed and scannability matter more than exploration.

## Capabilities and Constraints

- Plain JS (no TypeScript), Create React App, Chart.js via react-chartjs-2 for the only charts in the product.
- All backend calls go through the shared axios instance in `src/api.js`; a 401 hard-redirects to `/login`.
- Amplify CSP `connect-src` allowlist restricts what origins the browser may call in production — no new external origins without updating `amplify.yml`.
- No backend changes are in scope for UI work; API shapes are fixed.

## Brand Commitments

Product name "FitTrack." No existing logo or locked-in visual identity — the current purple-gradient look was never a deliberate brand decision and is being replaced.

## Evidence on Hand

No real user data, testimonials, or marketing copy exists or is needed — this is a personal/small-group tool, not a marketing surface. Sample values used while designing (workout counts, streaks, weights) must be treated as illustrative only, never shipped as real content.

## Product Principles

- Logging a workout is the single most frequent action — it must always be fast, visible, and near the top of Home.
- Never let expression slow down reading a stat or finding a control; this is an Operate surface, not a pitch.
- Destructive actions (deleting a logged or planned workout) get a real confirmation, not a silent click.
- Server-computed numbers (streak, week-over-week, consistency stats) are the product's actual differentiator — they should read as confident, legible data, not decoration.
- Small app, small team of users: no invented social proof, no growth-hack patterns, no gamification beyond what the backend already computes (streaks).

## PRD: Daily Calorie Tracker

**Status:** Product requirements for cross-squad contract discovery and implementation planning.

**Scope:** A personal food log with a daily calorie total and a user-entered daily target. No automatic target recommendation.

### Problem and opportunity

FitTrack already helps a user record workouts and review workout-calorie insights, but those records do not show food intake. A user who wants to track daily calories cannot currently record foods and compare the day's intake with a target in one personal tracker. A quick food log and clear daily comparison extend FitTrack's existing short-session, self-tracking loop without turning it into a coached diet or social product.

### Users and use cases

- **Primary user:** An authenticated FitTrack user who wants to track food intake for themselves, whether or not they also log workouts every day.
- Add a food item and its calorie amount after eating.
- Review today's or a prior day's food entries, total intake, and remaining/over-target amount.
- Set or adjust a personal daily calorie target and understand when no target has been set.
- Correct or remove an entry recorded by mistake.

### Goals and non-goals

**Goals**
- Make manual food logging quick and scannable on desktop and phone.
- Show a correct per-day total and compare it with a clearly identified, user-entered daily target.
- Keep food and target data private to the signed-in user and persistent across sessions.

**Out of scope**
- Food databases, barcode scanning, recipe parsing, meal plans, macronutrients, nutrient-quality judgments, weight-loss prescriptions, or suggested calorie targets.
- Social sharing, leaderboards, coaching, or third-party analytics/services.
- Changing workout-calorie calculations or existing workout insights as part of this feature.

### Success metrics

Evaluate the first release with a small usability pilot; the repo does not document an analytics platform, so do not assume one or add third-party tracking for this feature.

- **Task completion:** At least 80% of pilot participants can add a food item, find the daily total, and explain its relation to the target without assistance.
- **Logging speed:** Median time to enter one food item and its calories is at most 60 seconds in the usability pilot.
- **Data correctness:** All tested daily totals equal the sum of that user's entries for the selected date, and target comparisons are mathematically correct.
- **Persistence and isolation:** All tested entries/targets survive reload and are not visible to another user.

These are release evaluation targets, not claims about current usage or telemetry.

### User stories

1. As a user, I want to record a food name and its calories so that I can keep a personal daily intake log.
2. As a user, I want to see the total calories for a selected day against my own target so that I can understand my progress at a glance.
3. As a user, I want to set and edit my daily calorie target so that the comparison reflects the number I chose.
4. As a user, I want to edit or delete an incorrect food entry so that my daily total remains trustworthy.
5. As a user, I want to review a prior date so that I can check what I recorded without changing today's log.

### Functional requirements

1. **Entry fields:** A food entry has a user-visible food name, a positive whole-number calorie amount in kcal, and a calendar date. No additional nutrition fields are required.
2. **Create and maintain entries:** A signed-in user can add, edit, and delete their entries. New entries default to the current local calendar date; the user can choose today or a past date. Entries are not scheduled for future dates.
3. **Daily summary:** For the selected date, show the entry list, the sum of its calories, the user's daily target when set, and the difference. Label the difference as remaining when intake is below target and over target when intake exceeds it. Do not show a negative “remaining” value.
4. **Target:** The user can set and edit one positive whole-number daily calorie target. It is an explicit user choice, not calculated or recommended by FitTrack. With no target, show intake and an unobtrusive prompt to set one; do not imply a default.
5. **Date behavior:** A date is a calendar day in the user's local context. The API contract must agree how date-only values are represented and interpreted so entries do not shift days across time zones.
6. **Feedback and resilience:** Provide loading, empty, save-success, and recoverable error states. Confirm before deleting an entry, consistent with FitTrack's destructive-action pattern. A failed save must not be presented as saved.
7. **Privacy and persistence:** Food entries and target are associated with the authenticated user, persisted by the backend, and unavailable to other users. Frontend calls use the existing shared `src/api.js` client and its authentication behavior.
8. **Placement:** Make the daily summary and quick-add flow easy to find from Home, the app's primary short-session logging surface. The design squad may recommend the smallest coherent page/layout treatment consistent with existing navigation and tokens.

### Acceptance criteria

- An authenticated user can add a named food item with a valid positive whole-number kcal amount for today and see it in the day's list.
- The displayed daily total updates to the sum after add, edit, or delete; it does not include another date's entries.
- The user can select a past date and see only that date's entries and corresponding total.
- The daily target can be set and edited, persists after reload, and the summary correctly shows remaining or over-target calories.
- When no target exists, the UI clearly shows that state and does not invent a target or personalized recommendation.
- Invalid or missing names/calorie amounts are rejected with an actionable inline message; failed network saves leave the user informed and the entry is not falsely marked persisted.
- Deletion requires confirmation and canceling leaves the entry and total unchanged.
- Two-user tests establish that entries and targets are isolated by authenticated user.
- Layout and controls remain usable at the product's supported phone width as well as desktop.
- Date-only handling is covered at a timezone/day boundary by contract and integration tests.

### Squad requirements

**Frontend**
- Add a Home-accessible daily food log and summary using existing FitTrack Operate patterns, shared components/tokens, and `src/api.js`.
- Implement date selection, entry create/edit/delete, target set/edit, empty/no-target/loading/error states, and accurate display of the API-provided data.
- Do not invent endpoint paths or request/response fields before the contract is agreed. Avoid third-party origins and analytics.

**Backend (`fittrack-backend`)**
- Through the `fe-be-contract` flow, define and implement authenticated per-user persistence for food entries and the user's daily calorie target, plus the data needed to render one selected day's entries and total.
- Define validation, date-only semantics, ownership enforcement, and error behavior in the contract. Totals must be attributable to the selected user/date and consistent after mutations.
- Update the backend's canonical `openapi.json` and contract tests as part of backend-owned work; do not edit the sibling repository from this frontend/product task.

**Design**
- Keep the food log fast, legible, and consistent with the existing warm-neutral/ember Operate system and Home's workout-log priority.
- Specify hierarchy for target, total, remaining/over-target, date navigation, and no-target/empty/error states. Ensure the comparison is understandable without relying on color alone and works on narrow screens.
- Do not introduce nutrition advice, speculative food suggestions, or a new visual identity.

**Tester**
- Cover entry validation and CRUD, date separation and boundary semantics, total/target arithmetic (including equal, below, and above target), target absence, persistence, API errors, confirmation behavior, responsive usability, and cross-user isolation.
- Verify frontend/backend behavior against the accepted OpenAPI contract; include contract checks on backend-owned changes.

**Docs**
- Keep this PRD in `PRODUCT.md` as product source of truth.
- Backend owners document the agreed endpoint and schemas in `openapi.json`; frontend documentation may describe user-facing behavior after implementation. Do not publish provisional API shapes as settled documentation.

### Cross-squad API contract and backend delegation

This feature requires new backend-owned data and API behavior not established by this frontend product document. Handle it as a `fe-be-contract` flow: the frontend lead prepares a bounded request containing the purpose, acceptance criteria, required information (selected date, entries, daily target, and resulting total/comparison), and example use cases; the coordinator delegates it to `fittrack-backend`. Backend triages and proposes the contract, then updates the canonical `openapi.json` in a contract-only change. The squads implement against that agreed contract; do not assume exact routes, field names, response shapes, or error schemas here. Respect the shared additive-change/sign-off rules and keep all backend implementation in the backend repository.
