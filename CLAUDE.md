# PATNA Website — Claude Code Guidelines

## Project structure

- Public website copy lives in two places:
  - `apps/web/messages/en.json` — all i18n strings rendered via `getTranslations()` / `t()` keys
  - `apps/web/lib/patna-data.js` — static data arrays (timeline, LEAP phases, partners, board, etc.)
- Pages in `apps/web/app/(marketing)/` consume both sources; most visible text goes through the JSON translation keys.
- Other locale files (`fr.json`, `pt.json`, `ar.json`) mirror `en.json` — update those too whenever English copy changes.

---

## Website copy standards

PATNA is a registered non-profit NGO and professional research network. All public copy must be:

- **Accurate and attributable** — state only what is verifiably true and properly credited
- **Collaborative in framing** — PATNA works *with* African delegations and institutions, not *for* or *instead of* them
- **Accessible to non-specialists** — avoid IMO jargon without a brief explanation; assume readers are intelligent but not maritime insiders
- **Professionally restrained** — no exclamation-mark energy; confident but not boastful

---

## Copy rules — apply on every edit

### 1. No single-agency credit for IMO decisions

PATNA does not unilaterally cause, delay, force, or secure IMO decisions. It provides research and technical support that *enables* African delegations to participate effectively.

| Avoid | Use instead |
|---|---|
| "PATNA secured the extension" | "PATNA's research and technical support helped Africa's delegation…" |
| "PATNA's advocacy contributed to the IMO's decision to adjourn…" | "PATNA's research supported Africa's participation in…" |
| "PATNA delayed the vote" | (do not write this under any circumstances) |
| "PATNA forced the framework revision" | (do not write this under any circumstances) |

### 2. No negative or passive framing of progress

IMO processes are multi-year and multi-actor. Outcomes PATNA contributed to should be framed around what was *built*, not what was *delayed*.

| Avoid | Use instead |
|---|---|
| "adjournment" / "delayed" / "postponed" | "additional time for guideline development" / "continued deliberation" |
| "rather than inheriting it" | "alongside other member states" |
| "long been absent" | "voice is still growing" / "historically under-represented" |

### 3. Refer to both ISWG-GHG 21 and MEPC 84 together

When describing PATNA's 2026 IMO engagement, always reference both sessions — they form a two-stage process. Using only "ISWG-GHG 21" undersells the scope; using only "MEPC 84" misattributes timing.

**Correct:** "At ISWG-GHG 21 and MEPC 84, PATNA's research and technical support helped Africa's delegations…"

### 4. PATNA's role vocabulary

Preferred verbs and phrases when describing PATNA's contribution:
- "research and technical support"
- "capacity building"
- "convened / co-organised"
- "helped [African delegations] contribute to…"
- "enabled Africa to participate in…"
- "provided evidence for…"
- "supported the development of…"

Avoid: "advocacy" (when describing outcome causation), "secured", "forced", "delivered [an IMO decision]"

### 5. Pressure language in strategy copy

Copy aimed at funders or partners should inspire, not alarm. Replace directive pressure words:

| Avoid | Use instead |
|---|---|
| "must be shaped by Africa" | "will be shaped by Africa's evidence and positions" |
| "cannot afford to be a bystander" | acceptable only in pull-quote / mission contexts, not in body copy |

### 6. Africa's coordination — frame as opportunity, not failure

Statements about Africa's historically lower coordination at international forums should frame this as an opportunity PATNA addresses, not as a collective shortcoming.

| Avoid | Use instead |
|---|---|
| "historically arrive…without aligned positions" | "have more to gain from greater coordination" |
| "under-resourced" when referring to delegations | "with growing capacity" |

---

## Factual items to verify before publishing

- **IMO membership figure:** The copy currently states "44 IMO member states" in `about.storyNarrative4`. Cross-check this against current IMO records — Africa has 55 AU member states but not all hold IMO membership. Ensure the figure is accurate.
- **Registration jurisdictions:** The `about.govIntro` copy lists Liberia, Seychelles, and Mauritius. Confirm this is current and accurate before any legal/governance page updates.
- **Event dates:** MEPC 84 and ISWG-GHG session dates should be verified against the IMO public calendar before any new event copy is added.

---

## Files changed in the June 2026 copy revision

| File | Keys / entries changed |
|---|---|
| `apps/web/lib/patna-data.js` | `storyTimeline` Apr 2026 entry (title + body); `leapPhases` Phase III body |
| `apps/web/messages/en.json` | `about.storyNarrative5`, `about.storyH2`, `about.stratImperative1Body`, `home.leapDesc`, `home.valuePropSubtitle`, `home.pillar2Body` |
