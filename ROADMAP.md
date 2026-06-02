# PATNA Website — Product Development Roadmap

## June 2026

### Website Copy Revision — IMO Framing & Editorial Standards
**Status:** Complete  
**Branch:** `feat/f-member-settings-ux`

Comprehensive audit and revision of all public-facing website copy to ensure PATNA's role is accurately and professionally represented. Key changes:

- **Reframed IMO participation language** across all pages — replaced single-agency credit ("PATNA secured…", "PATNA's advocacy caused…") with collaborative framing ("PATNA's research and technical support helped Africa's delegation contribute meaningfully to…")
- **Removed adjournment/delay framing** — progress at ISWG-GHG 21 and MEPC 84 is now described in terms of what was built (guidelines, equity provisions) rather than what was delayed
- **Updated references** to include both ISWG-GHG 21 and MEPC 84 wherever 2026 IMO engagement is described
- **Softened absence framing** — "long been absent" → "voice is still growing"; "collectively absent" → "collectively positioned to have greater impact"
- **Removed pressure language** — "must be shaped by Africa" → "will be shaped by Africa's evidence and positions"
- **Removed antagonistic framing** — "rather than inheriting it" → "alongside other member states"; "bold intervention" → "focused initiative"
- **Corrected over-attribution** — "built by the people in this network" → "shaped in part by the people in this network"

Files changed: `apps/web/messages/en.json`, `apps/web/lib/patna-data.js`

Added `CLAUDE.md` at repo root with full editorial standards for future copy work.

---

### Admin Feature: Work in Progress Page Management
**Status:** Complete  
**Branch:** `feat/f-member-settings-ux`

New admin control in **Website Settings** that lets an admin temporarily take any public page offline and replace it with a friendly "work in progress" holding message — without touching code or breaking anything else on the site.

**How it works:**

1. Admin navigates to **Admin → Tools → Website**
2. Expands the new **Work in Progress** collapsible section
3. Checks the box next to any page (Home, About, Projects, Insights, Events, Community, Work With Us)
4. Clicks **Save changes**
5. That page immediately shows a warm, branded holding message to all public visitors
6. When the work is done, uncheck the page and save — it goes live instantly

**What visitors see:**  
A full-page holding message with PATNA branding, a gently animated wrench icon, a friendly headline ("We're polishing this one."), a short explanation, links back to Home and About, and a contact email for urgent enquiries.

**Technical implementation:**

| File | Change |
|---|---|
| `apps/web/app/admin/website/components/wip-pages-picker.jsx` | New client component — checkbox list of nav pages with instant save |
| `apps/web/app/admin/website/actions.js` | New `saveWipPagesAction` — upserts `wip_pages` key in `site_settings` |
| `apps/web/app/admin/website/page.jsx` | New collapsible "Work in Progress" section in Website admin page |
| `apps/web/components/wip-page-guard.jsx` | New client component — reads current pathname via `usePathname()`, renders WIP message if matched |
| `apps/web/app/(marketing)/layout.jsx` | Fetches `wip_pages` from `site_settings` and passes to `WipPageGuard` |
| `apps/web/app/globals.css` | Styles for `.wip-page` (public), `.wip-picker` (admin) |
| `apps/web/messages/en.json` | `admin.website.wipPages.*` translation keys |

**Storage:** Uses the existing `site_settings` table, key `wip_pages`, value `{ pages: ["/about", "/projects"] }`. No schema migration required.

**Constraints & notes:**
- The Home page (`/`) can be marked WIP but is flagged with a caution note in the admin UI — taking the homepage offline affects all visitors
- The admin panel itself (`/admin/*`) is unaffected regardless of WIP settings
- The member app (`/app/*`) is unaffected
- If `SUPABASE_SERVICE_ROLE_KEY` is not set (local dev without admin client), WIP pages default to empty and all pages remain live
- Page content is still server-rendered even when WIP is active — only the display is swapped on the client. This is intentional and avoids flash; a future optimisation could skip the data fetch with middleware-level redirect

---

## Backlog

### Copy — Remaining Factual Checks (Low Priority)
- Verify "44 IMO member states" figure in `about.storyNarrative4` against current IMO records
- Confirm PATNA's registered jurisdictions (Liberia, Seychelles, Mauritius) are current before any legal page updates
- Audit `events/page.jsx` and `insights/page.jsx` for hardcoded strings that should use `t()` keys (consistency, not copy quality)

### WIP Feature — Future Enhancements (Optional)
- Add optional custom message per page (e.g., "Back on [date]") — admin text field per page in the picker
- Add middleware-level redirect for WIP pages to skip server rendering entirely (performance optimisation for high-traffic pages)
- Extend WIP to cover member app routes (`/app/*`) with a separate toggle group
