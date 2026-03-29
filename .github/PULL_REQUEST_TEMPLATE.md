## Summary

- What changed for users, members, or admins?

## Testing

- [ ] `pnpm build` passes locally
- [ ] Relevant routes or flows were manually tested

## Release Notes

- Surface affected:
  - [ ] Public site
  - [ ] Member workspace
  - [ ] Admin workspace
  - [ ] Supabase / data workflow

- Env vars or external settings required?
  - [ ] No
  - [ ] Yes, described below

## PATNA Review Checklist

- [ ] Scope is understood
- [ ] Release timing is agreed
- [ ] Any Vercel or Supabase setting changes are documented
- [ ] If the Vercel preview check is red, confirm whether it is only the known access limitation for contributor branches

## Deployment Reminder

- PATNA merges to `main`
- PATNA manually redeploys the merged commit from the PATNA-owned Vercel project
- A failed Vercel preview on a contributor PR does not block merge on the current private free-plan setup
- If production breaks, PATNA redeploys the last healthy deployment first
