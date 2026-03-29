# Contributing to PATNA

This repository uses GitHub for collaboration and Vercel as the PATNA-owned production release gate.

## Working model

- Fitzroy and other collaborators build features locally and push code to the PATNA GitHub repository.
- PATNA remains the release owner for production.
- Production should be deployed from the PATNA GitHub repository through the PATNA Vercel project.
- Production secrets must stay in Vercel. Do not store them in GitHub.

## Branching

- Treat `main` as production-ready.
- Create a branch per task:
  - `feat/...`
  - `fix/...`
  - `chore/...`
  - `hotfix/...` for urgent production repairs
- Avoid direct pushes to `main` unless PATNA explicitly approves an emergency hotfix flow.

## Development flow

1. Pull the latest `main`.
2. Create a task branch.
3. Build and test locally.
4. Push the branch to `patna-digital/thepatna.org`.
5. Open a PR into `main`.

PR titles should describe the user-facing change, not just the implementation detail.

## Review and release

1. PATNA reviews the PR in GitHub.
2. If updates are needed, the contributor pushes more commits to the same branch.
3. PATNA approves and merges the PR into `main`.
4. PATNA manually redeploys the merged `main` commit from the Vercel dashboard.

PATNA is the production approver even when Fitzroy authored the change.

## Hotfix flow

If production is broken:

1. Branch from `main` using `hotfix/...`.
2. Push the fix and open a PR immediately.
3. PATNA reviews and merges quickly.
4. PATNA manually redeploys the merge commit.
5. If a rollback is safer or faster, PATNA should redeploy the previous healthy Vercel deployment first.

## Before opening a PR

- App runs locally
- `pnpm build` passes
- Relevant pages or flows are manually tested
- Any required environment-variable changes are called out in the PR description

## Before merging

- PATNA has reviewed the diff
- PATNA agrees on release timing
- Any required Vercel or Supabase settings changes are understood

## Before deploying

- Confirm production env vars already exist in Vercel
- Confirm the target deployment is the intended merged commit on `main`
- Confirm the Vercel project still points at the PATNA GitHub repo and correct root directory

## After deploying

- Test homepage
- Test login
- Test one admin route
- Test one member route
- If broken, redeploy the previous healthy deployment

## Manual platform settings

These controls live outside the repo and should be managed by PATNA:

- GitHub branch protection on `main`
- GitHub collaborator access
- Vercel production env vars
- Vercel domains
- Vercel framework, root directory, and build settings
