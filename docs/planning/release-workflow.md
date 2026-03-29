# PATNA Release Workflow

This runbook defines how code moves from a local machine to PATNA production when GitHub collaboration is shared but Vercel ownership stays with PATNA.

## Roles

- Contributor: builds features locally, pushes branches, updates PRs
- PATNA owner: reviews, merges, deploys, owns runtime configuration

## Source of truth

- GitHub is the collaboration and approval layer
- Vercel is the production release layer
- Production should be deployed from the PATNA-owned Vercel project only

## Standard release flow

1. Contributor branches from `main`
2. Contributor builds, tests, and pushes a feature branch
3. Contributor opens a PR into `main`
4. PATNA reviews the PR and requests changes if needed
5. PATNA merges the PR into `main`
6. PATNA manually redeploys the latest `main` commit in Vercel
7. PATNA runs post-deploy smoke checks

## Branch naming

- `feat/...` for features
- `fix/...` for non-urgent fixes
- `chore/...` for maintenance and tooling changes
- `hotfix/...` for urgent production repair

## Merge policy

- `main` should stay releasable
- PRs should be merged only after local build success and PATNA review
- Direct pushes to `main` are discouraged
- Emergency direct pushes should be rare and treated as exceptions
- On the current private free-plan GitHub setup, branch rulesets are not enforced. PATNA should apply this policy manually until the organization upgrades.

## Deployment policy

- PATNA controls:
  - Vercel env vars
  - domains
  - build settings
  - production deploy timing
- Contributors should not deploy production from local machines
- If preview deployments are available, they are for review only and do not replace PATNA’s production deploy step
- Contributor PRs may show a failed Vercel deployment check because Fitzroy does not have Vercel project access. That failure should not be treated as a release-quality signal on the current setup.

## Hotfix procedure

1. Branch from `main` using `hotfix/...`
2. Push the fix and open a PR immediately
3. PATNA reviews and merges as fast as practical
4. PATNA deploys the merged commit manually
5. If production is unstable, PATNA may redeploy the previous healthy Vercel deployment before merging the fix

## Pull request checklist

Every PR should make it clear:

- what changed for users or admins
- what was tested locally
- whether env vars or external settings are required
- whether the change affects public, member, or admin routes

## PATNA owner checklist

Before merge:

- confirm PR scope
- confirm release timing
- confirm any external config changes

Before deploy:

- confirm correct merged commit on `main`
- confirm required Vercel env vars already exist
- confirm project settings still match the repo layout

After deploy:

- homepage loads
- login works
- one admin path works
- one member path works
- redeploy previous healthy version if needed

## Recommended manual settings

### GitHub

- Add Fitzroy as a collaborator
- Configure a ruleset named `Protect main`
- Set target branch to the default branch / `main`
- Enable:
  - `Require a pull request before merging`
  - `Block force pushes`
- Leave off:
  - `Require deployments to succeed`
  - `Require status checks to pass`
  - `Restrict creations`
  - `Restrict updates`
  - `Restrict deletions`
  - `Require signed commits`
  - `Require code scanning results`
  - `Require code quality results`
  - `Automatically request Copilot code review`
- Optional later:
  - `Require linear history`
- Important:
  - GitHub will not enforce these rules on this private repository until the PATNA organization upgrades to GitHub Team
  - until then, PATNA must enforce the merge policy manually

### Vercel

- Keep PATNA as project owner
- Keep PATNA in control of env vars and domains
- Use the PATNA GitHub repo as the connected source
- Deploy merged `main` commits to production
- Do not make the Vercel deployment check a required merge gate while contributor branches cannot create preview deployments
