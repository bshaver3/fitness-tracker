# Design

<!-- impeccable:design-schema 1 -->

## Direction

**Mode:** Operate. FitTrack is a personal workout log a small circle of people check in short sessions — logging a workout right after training, or glancing at progress. Nothing here needs to persuade; it needs to be fast, legible, and never in the way of the data.

**Replaced:** the entire previous surface (purple/indigo gradient text, glowing box-shadows, unicode ✕ glyphs standing in for icons, `window.alert`/`window.confirm` for feedback). None of it was a deliberate brand decision — see `PRODUCT.md` → Brand Commitments — so it was replaced wholesale rather than polished in place.

**Color strategy — Committed.** One saturated accent, "ember" (a warm exertion red-orange), carries the header/nav bar, every primary action, the active nav tab, and the numbers that matter most (weekly goal, streak). Everything else sits on a warm off-white/neutral base so the accent keeps its meaning. This deliberately moves away from the purple/indigo-on-white default most AI-generated dashboards land on.

**Type.** System UI stack throughout (`-apple-system, "Segoe UI", "Inter", …`). This is an Operate surface — a workhorse face serves it better than a display face with "a point of view," which belongs to Persuade/Experience work, not a personal dashboard.

**Signature interaction.** Page headers and cards rise in once on mount (`rise` keyframe, 8px translate + fade, exponential ease-out) — one authored moment, not scattered per-element flourishes. Progress bars animate via `transform: scaleX` (not `width`) to stay off the layout-thrash path.

## Tokens

Defined as CSS custom properties in `src/index.css`, consumed everywhere via `src/App.css`'s component classes — no inline style objects for anything token-driven.

- **Ink:** `--ink-900/700/500/300` (near-black → muted) on a warm base, never pure gray.
- **Surface:** `--surface-page` (warm off-white page bg), `--surface-card` (near-white card bg), `--surface-sunken` (recessed fills — progress track, view-toggle rail), `--surface-header` (near-black nav/calendar-nav bar).
- **Accent ("ember"):** `--accent-900…100` plus `--accent-ink` (text-on-accent). Carries primary buttons, active nav link, focus rings, stat highlight numbers, calendar "today" ring, scheduled-workout chips.
- **Semantic:** `--success-700/500/100` (positive deltas, completed progress), `--danger-700/600/500/100` (destructive actions, negative deltas), `--warning-700/500/100` (missed-workout flag).
- **Type scale:** `--step-xs` … `--step-2xl` (0.75rem → 2.25rem).
- **Spacing scale:** `--space-1` … `--space-16`, 4px base.
- **Radius:** `--radius-sm/md/lg` (6/10/16px). **Shadow:** `--shadow-sm/md/lg`, always offset + blur, never a flat colored glow.
- **Motion:** `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) used for every transition/animation in the app.

## Components (`src/App.css`)

Buttons (`.btn-primary/secondary/danger/ghost`), form fields (`.input/.select/.textarea` + `.field`/`.field-label`), stat tiles (`.stat-card`), generic panels (`.panel`, `.form-panel`), list rows (`.item-row`, used for logged workouts and planned workouts instead of a uniform card grid), key/value tables (`.kv-list`/`.kv-row`, used for Consistency Stats and the week-over-week comparison), progress bars (`.progress-track`/`.progress-fill`), badges, empty states, skeleton loaders, toasts, a confirm dialog, the view toggle and calendar (Goals), and the auth card shell (Login/Signup).

Every browser surface is themed from the palette: `::selection`, the WebKit scrollbar, and `:focus-visible` all use the accent rather than browser defaults.

## Icons

`src/Icons.js` — a small authored single-stroke SVG set (24×24, 2px stroke, round caps/joins): close, trash, chevron-left/right, arrow-right, flame (brand mark + streak), edit, check, alert. Replaces every unicode glyph (✕, →) the previous version used as ad hoc icons.

## Feedback patterns

- `src/ToastContext.js` — `useToast().showToast(message, type)`, a fixed bottom-right toast stack (`default`/`success`/`error`). Replaces every `alert(...)` call.
- `src/ConfirmDialog.js` — a real modal confirmation (focus-on-open, Escape to cancel, `role="alertdialog"`) for destructive actions (deleting a logged or planned workout). Replaces every `window.confirm(...)` call. A modal is justified here specifically because these are destructive, hard-to-reverse actions — not used elsewhere as a default container.

## Pages

- **Login / Signup** (`src/Login.js`, `src/Signup.js`) — centered `.auth-card`, inline error banner, no gradient text.
- **Home** (`src/Home.js`) — stat row (weekly goal / vs last week / streak), inline quick-log form, "missed workouts" flagged list (warning-tinted rows) with log-now/dismiss actions, workout history as list rows.
- **Goals** (`src/Goals.js`) — weekly-progress panel, schedule form, list/calendar view toggle. Calendar keeps the dark header-colored month nav bar for continuity with the main nav.
- **Insights** (`src/Insights.js`) — stat row, two Chart.js line charts (frequency, calories) recolored to the ember/success palette, workout-type doughnut, consistency stats and weight progress as key/value panels rather than another card grid.
- **Profile** (`src/Profile.js`) — long settings form using the shared field/input classes throughout.

### Home daily food log

Keep the existing workout log first in Home's short-session hierarchy. Place the daily food log directly after the workout quick-log area and before workout history, as one compact section using the established panel, form, list-row, and feedback patterns. It is a personal log, not a nutrition-advice surface.

**Hierarchy and interaction**

1. A section heading identifies the daily food log. A date control shows the selected local calendar date, defaults to today, and lets the user move among today and past dates. Do not offer future dates.
2. Show the selected day's intake total prominently, followed by the user's explicitly set daily target and a plainly labeled comparison. Below target, show the amount remaining; above target, show the amount over target. At an exact match, state “At target.” Keep the comparison understandable without color.
3. Keep a quick-add form immediately available: food name and a positive whole-number calorie amount in kcal, with a clear add action. New entries use the selected date. Each entry row shows its name and kcal amount with edit and delete actions. Editing uses the same two fields and preserves the selected day.
4. When a target is set, provide a quiet “Edit target” action. With no target, show the intake total and an unobtrusive “Set daily target” prompt; never display a default, recommendation, or inferred target. Setting or editing asks the user for one positive whole-number target in kcal.

**States**

- **Loading:** Keep the date and section heading visible; use the existing skeleton pattern for the total and entry rows. Do not show a stale day's entries as if they belonged to the newly selected date.
- **Empty day:** Show a zero intake total and a concise invitation to add the first food entry; keep quick-add available. The no-target treatment remains independent of whether the day has entries.
- **Saving:** Indicate progress on the active add, edit, or target action and prevent duplicate submission. Preserve entered values until the save succeeds; do not present an entry or target as saved before confirmation.
- **Recoverable error:** Give a concise, actionable inline message near the affected content or form, preserve the user's draft, and offer retry where appropriate. A failed save must not be presented as success. Keep already loaded entries visible when only a mutation fails.
- **Confirm delete:** Use the shared confirm dialog pattern and identify the entry being removed. Cancel is the safe default and leaves the entry and total unchanged; confirm removes it only after the operation succeeds.

**Responsive behavior and accessibility**

- On narrow screens, keep the total and comparison stacked and readable; let the date controls wrap without horizontal scrolling. Stack the two quick-add fields and make the primary action full-width if needed. Entry rows may wrap actions beneath the name and amount, with comfortable touch targets.
- Use a semantic section heading, explicitly associated labels for both entry fields and the target field, and visible kcal units. Make date navigation and row actions keyboard-operable with descriptive accessible names.
- Move focus into the delete confirmation on open, support Escape to cancel, and return focus to the initiating delete action when it closes. Announce loading completion, save outcomes, and recoverable errors through an appropriate live region; do not rely on color alone for remaining/over-target status.
- Preserve visible focus styling and sufficient contrast using existing tokens. Do not add nutrition fields, advice, food suggestions, or provisional API details to the interface specification.

## Verification

- Mechanical detector (`impeccable detect --json`) run across all changed `.css`/`.js` — one finding (progress bar animating `width`, a layout-thrash antipattern) found and fixed by switching to `transform: scaleX`; a clean re-run followed.
- Manually exercised in the browser pane against the local mock backend (`LOCAL_MOCK=true` FastAPI + `REACT_APP_MOCK_AUTH=true` CRA dev server): profile creation, workout logging (auto-calculated calories, streak/weekly-goal update, success toast), delete-workout confirm dialog, Goals list + calendar scheduling, Insights charts and stat panels, at both desktop and 375px mobile widths.
- Not run: the full comp-generation/finish-reviewer subagent pipeline (no image-generation tool available in this session, and this is an internal Operate tool rather than a Persuade/Experience surface) — scope substitution disclosed to the user at build time.
