# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Product scope, specs, backlog | Product | PRD for food logging, acceptance criteria, milestone order |
| Architecture, auth flow, API usage | Lead | State pattern, `src/api.js`, `amplify.yml` CSP, CI |
| Issue triage and cross-squad requests | Lead | `squad` label inbox, `[cross-squad]` issues from backend |
| UX flows, UI specs, design system | Designer | Food log flow, recommendation card, tokens, accessibility |
| React implementation | Frontend | New pages, components, charts, UI bugs |
| Tests and quality | Tester | Jest and RTL suite, flow checks, bug reproduction |
| Documentation | Docs | README, changelog, help text |

Add or edit rows here only when their agent names also exist in the casting registry.

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.

## Cross-Squad Routing

| Situation | Action |
|-----------|--------|
| Work belongs to the backend repo | Lead runs `squad delegate fittrack-backend "<request + acceptance criteria>"`. Never edit `../fitness-backend` from this squad. |
| Incoming `[cross-squad]` issue | Lead triages it like any `squad` issue and replies on the issue when done. |
| API contract change | Follow the `fe-be-contract` skill (`.squad/skills/fe-be-contract/SKILL.md`). |
| Quick question about the other repo | Read `../fitness-backend` (read-only), or ask through `copilot -C ../fitness-backend --agent squad -p "<question>"`. |
