---
name: sync-docs
description: Keep CLAUDE.md and docs/*.md in sync with code changes. Use after making code changes (or when the doc-sync Stop hook nudges) to find claims the change made outdated and update them. Also invokable manually as /sync-docs.
---

# sync-docs

Keep the project's documentation truthful after code changes. The goal: **no doc claim contradicts the current code.** Update docs to match reality — never change code to match a doc.

## When this runs

- Automatically nudged by the `Stop` doc-sync hook when code files changed in a turn but no `.md` did.
- Manually via `/sync-docs`.

## Scope of docs to keep in sync

- `CLAUDE.md` — the architecture map (stack versions, model/enum counts, module table, route groups, API routes, commands, key design decisions).
- `docs/*.md` — feature specs and their **status headers** (PLANNED / IMPLEMENTED / deployed), model & field references, file paths.
- Do **not** touch `AGENTS.md` (external guidance) or anything under `node_modules/`.

## Procedure

1. **See what changed.** Look only at what this turn/session touched:
   - `git status --porcelain` for the working-tree change set.
   - `git diff` (and `git diff --staged`) for the actual edits.
   Focus on changes under `app/`, `modules/`, `lib/`, `prisma/`, `components/`, `package.json`.

2. **Map each code change to doc claims it could falsify.** Common triggers:
   - `prisma/schema.prisma` → model/enum **counts** and the model lists in CLAUDE.md; field references in `docs/schema-notes.md` and feature docs. (Count models with `grep -c "^model " prisma/schema.prisma`, enums with `grep -c "^enum "`.)
   - `package.json` deps/scripts → the **Stack** line and **Commands** block in CLAUDE.md.
   - New/removed files under `app/api/` → the **API Routes** list.
   - New route group under `app/(...)` → the **Route Groups** table.
   - New service/action in a module → the **Module Structure** table if it changes what the module covers.
   - A feature going from built→deployed, or TEST→prod → the **status header** of the matching `docs/*.md` and any status note in memory. Distinguish "DB migration applied" from "code deployed" — they are separate.
   - New auth/permission file under `lib/auth/` → the **Auth** section.

3. **Verify before editing — never trust the old doc text.** Confirm the current truth from the code itself (grep/read), the same way you'd verify any claim. If a doc says "X is planned" but the service exists, the doc is stale.

4. **Apply the edits.** Make the docs match the code. Keep the existing voice and structure. Prefer surgical edits over rewrites. If a status line flips (e.g. PLANNED → shipped), update it and, where useful, leave a one-line breadcrumb of what changed.

5. **Summarize.** End with a short list: which docs changed and the one-line reason for each. If you concluded **no doc needed updating**, say so explicitly and why (this is a valid outcome — the hook only asks you to *check*).

## Guardrails

- **Docs follow code, not the reverse.** If a doc and the code disagree, the code is the source of truth (per CLAUDE.md's own rule).
- **Don't invent status.** Only mark something "deployed to prod" if the user said so or the evidence is in the repo — otherwise say "in code, deploy status unknown."
- **Don't over-edit.** A one-line internal helper rename usually needs no doc change. Bias toward accuracy, not churn.
- Keep push/PR/commit behavior unchanged — this routine only edits documentation.
