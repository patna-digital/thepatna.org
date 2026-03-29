# Web App Plan

`apps/web` should become the main Next.js application for both the public PATNA site and the authenticated member platform.

Recommended folder intent:

```text
app/
  (marketing)/       public pages
  (auth)/            login, reset password, invite acceptance
  app/               member area
  admin/             admin area
  api/               server endpoints where needed
components/
  marketing/
  community/
  admin/
  shared/
lib/
  supabase/
  auth/
  content/
  validation/
  utils/
mockups/
  public-site/
  community-space/
public/
  images/
  icons/
```

Mockups moved here:
- `mockups/public-site/patna-website-mockup.html`
- `mockups/community-space/patna-community-dashboard.jsx`

Primary route groups to implement:
- Public: `/`, `/about`, `/projects`, `/insights`, `/events`, `/community`, `/work-with-us`, `/contact`
- Auth: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/invite/[token]`
- Member: `/app`, `/app/profile`, `/app/members`, `/app/spaces`, `/app/insights`, `/app/settings`
- Admin: `/admin`, `/admin/applications`, `/admin/users`, `/admin/content`, `/admin/events`, `/admin/partners`

Supabase wiring added:
- `lib/env.js`
- `lib/supabase/client.js`
- `lib/supabase/server.js`
- `lib/supabase/admin.js`
- `proxy.js`

Current connected flows:
- `/auth/login`: Supabase email/password sign-in
- `/community/join`: writes applications into Supabase using a server action
