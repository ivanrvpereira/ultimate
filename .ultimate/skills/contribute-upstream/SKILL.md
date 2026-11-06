---
name: contribute-upstream
description: Send a change from this fork back to the upstream repository (HazAT/ultimate) as a clean pull request. Use when asked to contribute, upstream, open a PR to upstream, or when a fix on this fork is a clear-cut core improvement worth sharing.
---

# Contribute a change upstream

This checkout is a fork: `origin` is the fork, `upstream` is the original repository. The fork's `main` is the
user's own Ultimate and may carry personal commits; a contribution must carry none of them. Read `CONTRIBUTING.md`
first: it decides what upstream wants.

## 1. Decide whether it goes upstream

- A clear-cut fix or core improvement: a pull request that may merge.
- A feature: a pull request titled `Feature: …` with the `feature` label, as a reference that usually stays open.
- Personal taste or workflow: it does not go upstream; keep it in `.ultimate/` or `~/.ultimate/`.

Check the open pull requests for the same idea first: `gh pr list --repo HazAT/ultimate --state open --search "<words>"`.

## 2. Branch from upstream, not from the fork's main

```bash
git fetch upstream
wt switch --create <fix|feat>/<short-name> --base upstream/main   # or: git switch -c <branch> upstream/main
```

Bring the change over with `git cherry-pick` (or rewrite it there). `git log upstream/main..HEAD` must list only
this change's commits; `git diff upstream/main --stat` only its files.

## 3. Meet upstream's conventions

- Generic names in docs, prompts and comments: no personal names, machines, private repos or IPs.
- A regression test for a bug that actually happened; the code comment naming an origin when the code exists because
  of something outside it (AGENTS.md "Review quality").
- `pnpm check` and the tests covering the change pass.
- No secrets, no `.env`, nothing from `~/.ultimate/`.

## 4. Push to the fork and open the pull request

```bash
git push origin <branch>
gh pr create --repo HazAT/ultimate --head <fork-owner>:<branch> --base main --title "<title>" --body-file <file>
```

The body says what breaks without it, how it was verified (commands and output), and any divergence. Put agent
names in backticks (`` `@ultimate` ``): a bare `@name` notifies a real GitHub user.

Opening a pull request on another repository is outside the standing push permission: get the user's go first, and
report the PR URL when done. Never force-push a branch upstream reviewers may have seen.
