# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Product | Product | PRD, user story, backlog, milestone order, `PRODUCT.md` |
| Architecture | Lead | app structure, auth flow, state pattern, `src/api.js`, `amplify.yml`, route guard, Amplify config, environment variables |
| Design | Designer | UX flow, UI spec, design system, `DESIGN.md`, design tokens, layout, empty state, accessibility |
| Components | Frontend | React, component, form, page, chart, dropdown, button, CSS, render, UI bug |
| Testing | Tester | Jest, React Testing Library, test suite, regression test, flaky test, coverage |
| Documentation | Docs | README, changelog, help text |

Add or edit rows here only when their agent names also exist in the casting registry.

Squad's issue triage matches these rows by keyword. Keep each Work Type one distinctive word and put
match phrases in Examples, comma-separated. Do not add phrases that appear in every delegated issue
(`acceptance criteria`, `scope`, `triage`, `cross-squad`): they make every issue tie or misroute.
When no row wins, the issue goes to Lead, who names the members.

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
| Incoming `[cross-squad]` issue | Lead triages it like any `squad` issue and starts work at once. No owner approval. |
| Your work unblocks an issue in `bshaver3/Fitness-backend` | Comment there with branch name and summary, then `gh issue edit <n> --repo bshaver3/Fitness-backend --remove-label status:blocked`. |
| Work finished, PR open and reviewed | PR body has `Closes #N`. Label the issue `status:on-hold`. Do not close it. |
| Opening an issue for the other squad | Use `squad delegate fittrack-backend "..."`. If you must use `gh issue create`, the issue needs the `squad` label or no watcher picks it up. Do not add `squad:cross-squad` or any `squad:<member>` label; triage adds the member label. |
| API contract change | Follow the `fe-be-contract` skill (`.squad/skills/fe-be-contract/SKILL.md`). |
| Quick question about the other repo | Read `../fitness-backend` (read-only), or ask through `copilot -C ../fitness-backend --agent squad -p "<question>"`. |
