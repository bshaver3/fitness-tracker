# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brendan and a small circle of friends/family who each track their own workouts. Casual-to-serious gym-goers with mixed experience levels (the profile setup explicitly asks gym experience from beginner to expert). Primary device is a laptop/desktop, though the app must remain usable on a phone.

## Product Purpose

FitTrack lets a user log workouts, plan future ones, and see whether they're on pace against their own weekly goal. Success is a user who logged in daily/weekly can tell at a glance: did I hit my target this week, am I trending up or down vs last week, and what's still on my calendar.

## Positioning

Not a social fitness network and not a coached program — it's a personal log with a plan-ahead calendar and server-computed insights (streaks, week-over-week deltas, consistency stats) tailored to one person's own weekly target, not a leaderboard against others.

## Operating Context

- Sign in via Cognito (email/password, email verification code). A brand-new account is forced through Profile setup (height, weight, age required) before it can reach any other page.
- Core loop: open Home → log a workout (type/duration/calories, calories auto-suggested from profile weight once type+duration are set) → see updated weekly progress, streak, and week-over-week comparison.
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
