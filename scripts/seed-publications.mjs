#!/usr/bin/env node
/**
 * seed-publications.mjs
 *
 * Migrates PATNA publications from the old WordPress site to Supabase.
 * - Downloads PDFs and cover images from WordPress CDN
 * - Uploads them to Supabase storage (publications bucket)
 * - Inserts content_items, content_attachments records
 *
 * Usage: node scripts/seed-publications.mjs
 * Requires: apps/web/.env.local with SUPABASE_SERVICE_ROLE_KEY set
 */

import { readFileSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(__dirname, '../apps/web/package.json'))
const { createClient } = require('@supabase/supabase-js')

// Load env from apps/web/.env.local
function loadEnv() {
  const envPath = resolve(__dirname, '../apps/web/.env.local')
  const content = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    env[key] = val
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PATNA-Migration/1.0' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadToStorage(bucket, path, buffer, contentType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function slugify(filename) {
  return filename.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase()
}

// ─── Publication data ──────────────────────────────────────────────────────────

const PUBLICATIONS = [
  {
    slug: 'kenyas-national-maritime-ghg-emissions-inventory',
    title: "Kenya's National Maritime GHG Emissions Inventory",
    content_type: 'report',
    published_at: '2026-03-20T23:34:17+00:00',
    summary: "This report presents Kenya's first voyage-based national maritime greenhouse gas (GHG) emissions inventory, developed under Task 1 of the Leading Effective Afrocentric Participation (LEAP) Project. Using Automatic Identification System (AIS)-derived vessel activity data and methodology aligned with the Fourth IMO GHG Study, the inventory quantifies energy demand and CO₂ emissions from both international and domestic shipping activity at Kenyan ports for the reference year. The findings are intended to strengthen Kenya's evidence base for IMO negotiations and inform the development of a nationally appropriate maritime decarbonisation strategy.",
    meta_description: "Kenya's first voyage-based national maritime GHG emissions inventory, quantifying CO₂ emissions from international and domestic shipping for the LEAP Project.",
    body: `<p>This report presents Kenya's first voyage-based national maritime greenhouse gas (GHG) emissions inventory, developed under Task 1 of the Leading Effective Afrocentric Participation (LEAP) Project. Using Automatic Identification System (AIS)-derived vessel activity data and methodology aligned with the Fourth IMO GHG Study, the inventory quantifies energy demand and CO₂ emissions from both international and domestic shipping activity at Kenyan ports for the reference year. The findings are intended to strengthen Kenya's evidence base for IMO negotiations and inform the development of a nationally appropriate maritime decarbonisation strategy.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Screenshot-2026-03-20-at-23.26.44.webp?fit=976%2C1378&ssl=1',
    cover_image_alt: 'Kenya National Maritime GHG Emissions Inventory',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/03/Kenya-National-Maritime-GHG-Emissions-Inventory.pdf',
    pdf_filename: 'Kenya-National-Maritime-GHG-Emissions-Inventory.pdf',
  },
  {
    slug: 'dakar-decarbonization-workshop-advancing-africas-maritime-sector-to-net-zero',
    title: "Dakar Decarbonization Workshop: Advancing Africa's Maritime Sector to Net-Zero",
    content_type: 'report',
    published_at: '2026-03-19T20:20:31+00:00',
    summary: "The Dakar Workshop on Measures for the Reduction of Greenhouse Gas Emissions from Ships, held from 4–6 August 2025, brought together more than 100 participants from 25 African IMO Member States, regional maritime organisations, international partners, and private sector stakeholders.",
    meta_description: "Report from the Dakar Workshop on GHG emissions reduction from ships, bringing together 100+ participants from 25 African IMO Member States.",
    body: `<p>The Dakar Workshop on Measures for the Reduction of Greenhouse Gas Emissions from Ships, held from 4–6 August 2025, brought together more than 100 participants from 25 African IMO Member States, regional maritime organisations, international partners, and private sector stakeholders.</p>
<p>Over three days, the workshop advanced Africa's collective understanding of the IMO 2023 Greenhouse Gas (GHG) Strategy, identified continental priorities, and adopted a series of resolutions to guide Africa's engagement at upcoming IMO negotiations.</p>
<p>Day 1 focused on setting the stage for Africa's maritime decarbonization. Presentations highlighted the urgency of ratifying MARPOL Annex VI, the opportunities and risks of the IMO Net Zero Framework, the critical role of maritime administrations, and the private sector's leadership through the African Shipowners Association. Panel discussions emphasised the need for unified African action and stronger representation in IMO processes.</p>
<p>Day 2 explored the financing and socio-economic dimensions of shipping decarbonization. Panels examined principles guiding the use of funds from the IMO GHG Strategy, the impacts of decarbonization on food security and trade, and the role of capacity building. Presentations on negotiation skills, port digitalisation, and equitable access to the Green Climate Fund reinforced the need for evidence-based advocacy. Two interactive Mentimeter sessions and stakeholder surveys captured participants' views, revealing strong hopes for unity and development, as well as deep concerns about injustice, inequity, and infrastructure gaps. Most respondents (72%) judged African ports as unprepared for clean vessels, with 50% prioritizing port infrastructure support as the top negotiation demand.</p>
<p>Day 3 was dedicated to reviewing the workshop proceedings and adopting resolutions. Chaired by Dr Harry Conway, discussions focused on unity and coordination, data-driven advocacy, capacity building, funding, and implementation. Delegates adopted 15 resolutions, including urgent calls to ratify MARPOL Annex VI, strengthen African representation at the IMO, define a Just and Equitable Transition (JET), leverage the Green Climate Fund, align policies with the AfCFTA, prioritise food security analysis, and accelerate port digitalisation.</p>
<p><strong>Key Outcomes of the Dakar Workshop:</strong></p>
<ul>
  <li>Ratification of MARPOL Annex VI is recognised as urgent for Africa's engagement with the IMO Net Zero Framework.</li>
  <li>Finance, infrastructure, capacity building, and regional coordination are identified as the four pillars of Africa's maritime decarbonization strategy.</li>
  <li>Agreement to pursue a common African definition of JET for submission to MEPC 84.</li>
  <li>Commitment to strengthening negotiation skills, ensuring fair participation of shipowners and private sector actors, and integrating data-driven advocacy.</li>
  <li>Recognition that, without urgent investment in infrastructure, Africa risks exclusion from future global shipping networks.</li>
</ul>
<p>The Dakar Workshop demonstrated Africa's determination to transform dialogue into action. The resolutions provide a roadmap for immediate, medium-term, and long-term steps, ensuring Africa's maritime sector can actively participate in and benefit from the global transition to low- and zero-carbon shipping.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Screenshot-2026-03-19-at-20.04.12.webp?fit=1244%2C1758&ssl=1',
    cover_image_alt: 'Dakar Decarbonization Workshop Report',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/03/Dakar-Workshop-Report-Draft.pdf',
    pdf_filename: 'Dakar-Workshop-Report-Draft.pdf',
  },
  {
    slug: 'the-impacts-of-imos-ship-ghg-reduction-strategy-on-african-economies',
    title: "The Impacts of IMO's Ship GHG Reduction Strategy on African Economies",
    content_type: 'report',
    published_at: '2026-03-19T19:54:39+00:00',
    summary: "This survey analysis reveals the perspectives of key maritime stakeholders on the impact of IMO's ship decarbonisation strategy, based on responses from 40+ representatives from 25 countries spanning government, private sector, academia, and civil society.",
    meta_description: "Survey analysis of key maritime stakeholders' perspectives on the impact of IMO's ship decarbonisation strategy across 25 African countries.",
    body: `<p>This survey analysis reveals the perspectives of key maritime stakeholders on the impact of IMO's ship decarbonisation strategy, based on responses from 40+ representatives from 25 countries spanning government, private sector, academia, and civil society.</p>
<p>The report analyses results from a stakeholder survey conducted during the Dakar Workshop on Measures for the Reduction of Greenhouse Gas Emissions from Ships (August 2025). The survey captured the views of participants on the opportunities and challenges of the IMO's 2023 GHG Strategy for African economies.</p>
<p>Key findings include strong consensus on the urgency of action, significant concerns about infrastructure readiness and equitable access to financing, and clear priorities around port development, capacity building, and engagement with the Green Climate Fund.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/The-Impacts-of-IMOs-Ship-GHG-Reduction-Strategy-on-African-Economies.webp?fit=1920%2C1080&ssl=1',
    cover_image_alt: "A Survey on the Impacts of IMO's Ship Decarbonisation Strategy (Dakar Workshop, 2025)",
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/03/The-Impacts-of-IMOs-Ship-GHG-Reduction-Strategy-on-African-Economies-1.pdf',
    pdf_filename: 'The-Impacts-of-IMOs-Ship-GHG-Reduction-Strategy-on-African-Economies.pdf',
  },
  {
    slug: 'defining-just-and-equitable-transition-for-africa-dakar-workshop-2025',
    title: 'Defining Just and Equitable Transition for Africa (Dakar Workshop, 2025)',
    content_type: 'report',
    published_at: '2026-03-19T19:38:31+00:00',
    summary: "This document is a report on the insights derived from polling key representatives of 25 African member states of the International Maritime Organisation (IMO), including regional and national organisations and private sector stakeholders, at the Dakar Workshop on Measures for the Reduction of Greenhouse Gas Emissions from Ships (4–6 August 2025).",
    meta_description: "Report on insights from polling 25 African IMO member states on defining a Just and Equitable Transition for Africa's maritime green transition.",
    body: `<p>This document is a report on the insights derived from polling key representatives of 25 African member states of the International Maritime Organisation (IMO), including regional and national organisations and private sector stakeholders, at the Dakar Workshop on Measures for the Reduction of Greenhouse Gas Emissions from Ships (4–6 August 2025).</p>
<p>The report captures the diversity of perspectives on what constitutes a Just and Equitable Transition (JET) for Africa's maritime sector, and outlines the principles and priorities that should guide Africa's engagement in IMO negotiations on this issue.</p>
<p>Key areas addressed include equitable burden-sharing, access to green finance, protection of vulnerable economies, and the need for differentiated approaches that account for Africa's unique development context.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Defining-a-Just-and-Equitable-Transition-for-Africas-Maritime-Green-Transition-1.jpg?fit=1920%2C1080&ssl=1',
    cover_image_alt: 'Dakar Workshop Survey, 2025',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/03/Defining-a-Just-and-Equitable-Transition-for-Africas-Maritime-Green-Transition.pdf',
    pdf_filename: 'Defining-a-Just-and-Equitable-Transition-for-Africas-Maritime-Green-Transition.pdf',
  },
  {
    slug: 'complementary-quantitative-stakeholders-analysis-the-case-study-of-namibia',
    title: "Complementary Quantitative Stakeholders' Analysis: The Case Study of Namibia",
    content_type: 'report',
    published_at: '2026-02-11T14:16:28+00:00',
    summary: "This case study presents a complementary quantitative stakeholder analysis of the potential impacts of the International Maritime Organization's (IMO) candidate mid-term greenhouse gas (GHG) reduction measures on Namibia.",
    meta_description: "Quantitative stakeholder analysis of the IMO's candidate mid-term GHG reduction measures' potential impacts on Namibia's maritime sector and economy.",
    body: `<p>This case study presents a complementary quantitative stakeholder analysis of the potential impacts of the International Maritime Organization's (IMO) candidate mid-term greenhouse gas (GHG) reduction measures on Namibia.</p>
<p>The analysis examines Namibia's exposure to increased shipping costs, potential impacts on trade competitiveness, and the implications for its developing maritime sector. It identifies key stakeholder groups most affected and outlines recommendations for Namibia's engagement in IMO negotiations.</p>
<p>The study draws on quantitative modelling of trade flows, shipping cost pass-through mechanisms, and sector-specific impact assessments to provide an evidence base for policy positions.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/02/Screenshot-2026-02-11-at-18.05.03.png?fit=1292%2C814&ssl=1',
    cover_image_alt: "Complementary Quantitative Stakeholders' Analysis: The Case Study of Namibia",
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/02/Namibia-case-study.pdf',
    pdf_filename: 'Namibia-case-study.pdf',
  },
  {
    slug: 'impact-assessment-of-the-imo-basket-of-candidate-mid-term-ghg-reduction-measures-the-nigeria-case-study',
    title: 'Impact Assessment of the IMO basket of candidate mid-term GHG reduction measures: The Nigeria Case Study',
    content_type: 'report',
    published_at: '2026-02-11T06:43:55+00:00',
    summary: "This study presents a Nigeria-focused impact assessment of the International Maritime Organization's (IMO) proposed basket of candidate mid-term greenhouse gas (GHG) reduction measures, developed in the context of the IMO's 2023 GHG Strategy.",
    meta_description: "Nigeria-focused impact assessment of the IMO's proposed basket of mid-term GHG reduction measures, examining economic and trade implications.",
    body: `<p>This study presents a Nigeria-focused impact assessment of the International Maritime Organization's (IMO) proposed basket of candidate mid-term greenhouse gas (GHG) reduction measures, developed in the context of the IMO's 2023 GHG Strategy.</p>
<p>As Africa's largest economy and a major maritime trading nation, Nigeria's exposure to IMO regulatory changes is significant. This study quantifies the potential impacts on shipping costs, trade volumes, and key economic sectors, while identifying opportunities for Nigeria to position itself advantageously in the green shipping transition.</p>
<p>The assessment covers the full basket of candidate mid-term measures under consideration at the IMO, including the GHG fuel intensity standard and the GHG emissions pricing mechanism, providing scenario analysis across different implementation pathways.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/02/Nigeria-case-study-cover-image.jpg?fit=2000%2C2000&ssl=1',
    cover_image_alt: 'Impact Assessment of the IMO basket of candidate mid-term GHG reduction measures: The Nigeria Case Study',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/02/Impact-Assessment-of-the-IMO-candidate-mid-term-GHG-reduction-measures-Nigeria-Case-Study.pdf',
    pdf_filename: 'Impact-Assessment-of-the-IMO-candidate-mid-term-GHG-reduction-measures-Nigeria-Case-Study.pdf',
  },
  {
    slug: 'complementary-quantitative-stakeholders-analysis-the-case-study-of-malawi',
    title: "Complementary Quantitative Stakeholders' Analysis: The Case Study of Malawi",
    content_type: 'report',
    published_at: '2026-01-15T10:17:23+00:00',
    summary: "Land-linked, trade-dependent economies face disproportionate exposure to global maritime decarbonisation policies; yet their perspectives remain underrepresented in policy design. This study assesses the potential impacts of the IMO's candidate mid-term GHG reduction measures on Malawi.",
    meta_description: "Stakeholder analysis examining how the IMO's mid-term GHG reduction measures affect Malawi, a landlocked trade-dependent economy disproportionately exposed to maritime policy.",
    body: `<p>Land-linked, trade-dependent economies face disproportionate exposure to global maritime decarbonisation policies; yet their perspectives remain underrepresented in policy design. This study assesses the potential impacts of the IMO's candidate mid-term GHG reduction measures on Malawi.</p>
<p>Malawi, as a landlocked country entirely dependent on maritime trade routes for its imports and exports, faces unique vulnerabilities to shipping cost increases resulting from decarbonisation measures. This study quantifies these impacts and develops a framework for understanding how landlocked developing countries (LLDCs) should engage in IMO processes.</p>
<p>The analysis provides actionable recommendations for Malawi's engagement in IMO negotiations and outlines the support mechanisms needed to ensure a just transition for economies like Malawi's.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/malawi-case-study-cover-image.jpg?fit=2000%2C2000&ssl=1',
    cover_image_alt: "Complementary Quantitative Stakeholders' Analysis: The Case Study of Malawi",
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/01/Complementary-Quantitative-Stakeholders-Analysis-The-Case-Study-of-Malawi.pdf',
    pdf_filename: 'Complementary-Quantitative-Stakeholders-Analysis-The-Case-Study-of-Malawi.pdf',
  },
  {
    slug: '2025-review-and-2026-in-view-report',
    title: '2025 Review and 2026 In-View Report',
    content_type: 'report',
    published_at: '2026-01-09T11:39:06+00:00',
    summary: "The PATNA 2025 Review and 2026 In-View Report presents a reflection on the Professional African Technical Network Advisory (PATNA) Initiative's progress in 2025 and outlines strategic priorities for 2026.",
    meta_description: "PATNA Initiative's annual review reflecting on 2025 achievements and outlining strategic priorities for 2026 in maritime decarbonisation advocacy.",
    body: `<p>The PATNA 2025 Review and 2026 In-View Report presents a reflection on the Professional African Technical Network Advisory (PATNA) Initiative's progress in 2025 and outlines strategic priorities for 2026.</p>
<p>2025 was a landmark year for the PATNA Initiative. The year saw the expansion of the network's membership, the launch of flagship research programmes, and significant engagement at key international forums including the Africa Climate Summit II, the Dakar Workshop, and multiple IMO sessions.</p>
<p>The report highlights key milestones, policy contributions, research outputs, and capacity building achievements, while charting the course for 2026 as the IMO moves toward finalising its mid-term GHG reduction measures.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/2025-Review-and-2026-In-View-Report.jpg?fit=1920%2C1080&ssl=1',
    cover_image_alt: '2025 Review and 2026 In-View Report',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/01/2025-Review-and-2026-In-View-Report_Final.pdf',
    pdf_filename: '2025-Review-and-2026-In-View-Report_Final.pdf',
  },
  {
    slug: 'an-africa-centric-analysis-of-the-unctad-comprehensive-impact-assessment-of-the-basket-of-candidate-ghg-reduction-mid-term-measures',
    title: 'An Africa-centric analysis of the UNCTAD Comprehensive Impact Assessment of the basket of candidate GHG reduction mid-term measures',
    content_type: 'report',
    published_at: '2026-01-02T19:21:56+00:00',
    summary: "This report presents an Africa-centric analysis of the United Nations Conference on Trade and Development (UNCTAD) Comprehensive Impact Assessment (CIA) of the International Maritime Organization's proposed basket of candidate GHG reduction mid-term measures.",
    meta_description: "Africa-centric analysis of UNCTAD's Comprehensive Impact Assessment of the IMO's proposed basket of candidate GHG reduction mid-term measures.",
    body: `<p>This report presents an Africa-centric analysis of the United Nations Conference on Trade and Development (UNCTAD) Comprehensive Impact Assessment (CIA) of the International Maritime Organization's proposed basket of candidate GHG reduction mid-term measures.</p>
<p>While the UNCTAD CIA provides a broad global assessment, Africa's specific circumstances—including its reliance on maritime trade, the vulnerability of Small Island Developing States and Landlocked Developing Countries, and the continent's limited capacity to transition to green fuels—warrant dedicated analysis.</p>
<p>This report re-examines the UNCTAD findings through an African lens, identifies areas where the CIA may understate African vulnerabilities, and develops complementary analysis to fill these gaps. It provides African negotiators with an evidence-based foundation for engaging with the UNCTAD findings at the IMO.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/Screenshot-2026-01-08-at-17.55.36-scaled.png?fit=2560%2C1486&ssl=1',
    cover_image_alt: 'An Africa-centric analysis of the UNCTAD CIA',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2026/01/An-Africa-centric-analysis-of-the-UNCTAD-Comprehensive-Impact-Assessment-of-the-basket-of-candidate-GHG-reduction-mid-term-measures.pdf',
    pdf_filename: 'An-Africa-centric-analysis-of-the-UNCTAD-Comprehensive-Impact-Assessment.pdf',
  },
  {
    slug: 'the-path-to-maritime-net-zero',
    title: 'The Path to Maritime Net-Zero',
    content_type: 'report',
    published_at: '2025-10-28T14:41:04+00:00',
    summary: "The 20th Intersessional Working Group on GHG Reduction (ISWG-GHG 20) convened with a clear mandate: to advance the technical architecture of the IMO Net-Zero Framework in line with the 2023 IMO GHG Strategy. This report analyses the outcomes and their implications for African states.",
    meta_description: "Analysis of ISWG-GHG 20 outcomes and the technical architecture of the IMO Net-Zero Framework, with a focus on implications for African maritime states.",
    body: `<p>The 20th Intersessional Working Group on GHG Reduction (ISWG-GHG 20) convened with a clear mandate: to advance the technical architecture of the IMO Net-Zero Framework in line with the 2023 IMO GHG Strategy. The session's progress was framed by a significant strategic challenge—the one-year adjournment of the decision on the MARPOL Annex VI amendments—which created a climate of regulatory uncertainty.</p>
<p>Despite this delay, the Group achieved a cautious but constructive outcome, deliberately prioritising consensus on the technical 'how' of future regulations while deferring the more contentious political 'what' and 'who pays' questions for a later date. This strategic choice to advance the development of technical guidelines was aimed at maintaining critical momentum, providing much-needed clarity to the industry and Member States, and ensuring that future decisions by the Marine Environment Protection Committee (MEPC) will be better informed.</p>
<p><strong>Key Outcomes of the 20th IMO Intersessional Working Group on Greenhouse Gas Reduction:</strong></p>
<p>The working group made progress on the technical foundations of the IMO Net-Zero Framework, including guidelines on the GHG fuel intensity standard and the emissions pricing mechanism, while deferring final decisions on the regulatory architecture to MEPC 84.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/10/The-Path-to-Maritime-Net-Zero-Cover-Presentation.jpg?fit=1920%2C1080&ssl=1',
    cover_image_alt: 'The Path to Maritime Net-Zero Cover Presentation',
    pdf_url: 'https://thepatna.org/wp-content/uploads/2025/10/The-Path-to-Maritime-Net-Zero-PATNA-Report.pdf',
    pdf_filename: 'The-Path-to-Maritime-Net-Zero-PATNA-Report.pdf',
  },
  {
    slug: 'report-of-the-second-extraordinary-session-of-the-marine-environment-protection-committee-mepc-es-2',
    title: 'Report of the Second Extraordinary Session of the Marine Environment Protection Committee (MEPC/ES.2)',
    content_type: 'news',
    published_at: '2025-10-18T19:34:41+00:00',
    summary: "Between the 14th and 17th of October 2025, 135 countries convened at the London headquarters of the International Maritime Organisation for an extraordinary session. The IMO's Marine Environment Protection Committee met for only its second extraordinary session in history to adopt the IMO Net Zero Framework.",
    meta_description: "Coverage of MEPC/ES.2, the IMO's second extraordinary session where 135 countries convened to adopt the IMO Net Zero Framework for international shipping.",
    body: `<p>Between the 14th and 17th of October 2025, 135 countries convened at the London headquarters of the International Maritime Organisation for an extraordinary session. The IMO's Marine Environment Protection Committee met for only its second extraordinary session in history to adopt the IMO Net Zero Framework.</p>
<p>The session marked a historic moment for international shipping regulation. After years of negotiations, Member States reached agreement on the framework that will govern the decarbonisation of the global shipping industry through to 2050 and beyond.</p>
<p>The PATNA Initiative was present at MEPC/ES.2 and produced this report to provide African stakeholders with a comprehensive account of the session's outcomes, the positions taken by African delegations, and the implications for Africa's maritime sector.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/10/MEPC-82_inside-pic_mediu-1.webp?fit=1000%2C667&ssl=1',
    cover_image_alt: 'MEPC/ES.2 - Second Extraordinary Session of the Marine Environment Protection Committee',
    pdf_url: null, // Google Drive link - cannot auto-download
    pdf_filename: null,
    pdf_external_url: 'https://drive.google.com/file/d/1vfT8Zns9pC9zY2RMVkk7vZd53YgiZP6U/view?usp=sharing',
  },
  {
    slug: 'ports-people-and-pathways-africas-just-maritime-transition-at-the-africa-climate-summit-ii-acs2',
    title: "Ports, People, and Pathways: Africa's Just Maritime Transition at the Africa Climate Summit II (ACS2)",
    content_type: 'blog',
    published_at: '2025-09-21T15:10:33+00:00',
    summary: "When leaders, experts, and civil society gathered at the African Union Headquarters in Addis Ababa for the Africa Climate Summit II (ACS2) this September, the message was unmistakable: Africa will take the lead as rule-shapers of the climate transition.",
    meta_description: "PATNA Initiative's engagement at Africa Climate Summit II (ACS2), showcasing Africa's maritime decarbonisation leadership at the Africa Ocean-Climate Solutions Pavilion.",
    body: `<p>When leaders, experts, and civil society gathered at the African Union Headquarters in Addis Ababa for the Africa Climate Summit II (ACS2) this September, the message was unmistakable: Africa will take the lead as rule-shapers of the climate transition.</p>
<p>Held under the theme 'Accelerating Global Climate Solutions: Financing for Africa's Resilient and Green Development,' the Summit marked a decisive moment. For decades, the continent has been described mostly in terms of its vulnerabilities. Turning this on its head, a strong messaging of Africa's opportunities became central in most conversations. The Africa Ocean-Climate Solutions Pavilion, convened by the Oceans Resilience and Climate Action (ORCA) and Ocean Visions, in partnership with the Professional African Technical Network Advisory (PATNA) Initiative and others, became one of the clearest demonstrations of this shift.</p>
<p>Over two sessions organised by the PATNA Initiative, featuring presentations and four distinct high-level panel discussions, governmental and private sector leaders, industry experts, policymakers, and researchers shared the reimagination of Africa's ocean governance and leadership. Maritime decarbonisation and ocean-energy transition emerged not as a burden, but as an opportunity for economic transformation and industrial revolution for Africa. This pathway unlocks human security (food, health, energy), financial independence, industrialisation, and inclusive growth.</p>
<h2>Africa as Rule Shapers</h2>
<p>A clear caution from Kenya's Special Envoy and Advisor for Maritime and Blue Economy in the Executive Office of the President, Ambassador Nancy Karigithu, was for Africa to avoid being left behind as a 'rule-taker' in global negotiations. Instead, the continent should leverage its demographic, geographic, and resource advantages to shape the rules of the green maritime transition.</p>
<p>The PATNA Initiative's engagement at ACS2 reinforced the case for African leadership, technical capacity, and unified advocacy in international maritime forums—particularly as the IMO moves toward adopting its Net Zero Framework.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/a6fe0c8a-e39a-40b9-b336-12560e9398bb-1.webp',
    cover_image_alt: "Africa's Just Maritime Transition at ACS2",
    pdf_url: null,
    pdf_filename: null,
  },
  {
    slug: 'ghanas-international-shippingemissions-inventory-report',
    title: "Ghana's International Shipping Emissions Inventory Report: 2018–2023 Voyage-based Analysis",
    content_type: 'report',
    published_at: '2025-08-22T00:00:00+00:00',
    summary: "The Fourth International Maritime Organization (IMO) Greenhouse Gas (GHG) Study, published in 2020, estimated that the maritime industry contributed 2.89% to global anthropogenic GHG emissions in 2018. This report presents Ghana's voyage-based international shipping emissions inventory for 2018–2023.",
    meta_description: "Ghana's voyage-based international shipping GHG emissions inventory covering 2018–2023, developed to strengthen Ghana's evidence base for IMO negotiations.",
    body: `<p>The Fourth International Maritime Organization (IMO) Greenhouse Gas (GHG) Study, published in 2020, estimated that the maritime industry contributed 2.89% to global anthropogenic GHG emissions in 2018. This report presents Ghana's voyage-based international shipping emissions inventory for 2018–2023.</p>
<p>Developed using Automatic Identification System (AIS)-derived vessel activity data, the inventory provides a comprehensive baseline of shipping-related GHG emissions at Ghanaian ports. The methodology is aligned with the Fourth IMO GHG Study, enabling direct comparisons with international benchmarks.</p>
<p>The findings support Ghana's capacity to engage evidence-based advocacy at the IMO and contribute to the development of a nationally appropriate maritime decarbonisation strategy. The inventory covers CO₂ and other greenhouse gas emissions from international shipping activity at Ghana's major ports for the reference period.</p>`,
    cover_image_url: 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/08/Ghanas-Report-PATNA.pdf.jpg?fit=1920%2C1080&ssl=1',
    cover_image_alt: "Ghana's International Shipping Emissions Inventory Report",
    pdf_url: 'https://thepatna.org/wp-content/uploads/2025/08/Ghanas-Report-PATNA.pdf',
    pdf_filename: 'Ghanas-Report-PATNA.pdf',
  },
]

// ─── Main migration ────────────────────────────────────────────────────────────

async function downloadAndUpload(url, storagePath, mimeType) {
  console.log(`  Downloading: ${url}`)
  const buffer = await downloadBuffer(url)
  console.log(`  Uploading to storage: ${storagePath} (${(buffer.length / 1024).toFixed(0)} KB)`)
  const publicUrl = await uploadToStorage('publications', storagePath, buffer, mimeType)
  console.log(`  ✓ Stored at: ${publicUrl}`)
  return publicUrl
}

async function run() {
  console.log('=== PATNA Publications Migration ===\n')

  // Verify bucket exists
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  if (bucketErr) {
    console.error('Cannot list storage buckets. Has migration 0020 been applied?', bucketErr.message)
    process.exit(1)
  }
  const hasBucket = buckets.some(b => b.name === 'publications')
  if (!hasBucket) {
    console.error('Storage bucket "publications" not found. Run: bash scripts/supabase-push.sh first.')
    process.exit(1)
  }
  console.log('✓ Storage bucket "publications" confirmed\n')

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const pub of PUBLICATIONS) {
    console.log(`\n─── ${pub.title} ───`)

    // Check if already exists
    const { data: existing } = await supabase
      .from('content_items')
      .select('id, slug')
      .eq('slug', pub.slug)
      .single()

    if (existing) {
      console.log(`  ⚠ Already exists (id: ${existing.id}) — skipping`)
      skipped++
      continue
    }

    try {
      // Download and upload cover image
      let coverImageUrl = pub.cover_image_url
      if (pub.cover_image_url) {
        try {
          const imgExt = pub.cover_image_url.includes('.webp') ? 'webp'
            : pub.cover_image_url.includes('.png') ? 'png' : 'jpg'
          const imgMime = imgExt === 'webp' ? 'image/webp'
            : imgExt === 'png' ? 'image/png' : 'image/jpeg'
          const imgPath = `covers/${pub.slug}.${imgExt}`
          coverImageUrl = await downloadAndUpload(pub.cover_image_url, imgPath, imgMime)
        } catch (imgErr) {
          console.warn(`  ⚠ Cover image download failed, using original URL: ${imgErr.message}`)
          // Keep original URL as fallback
        }
      }

      // Download and upload PDF
      let pdfStorageUrl = null
      if (pub.pdf_url) {
        try {
          const pdfPath = `pdfs/${pub.pdf_filename}`
          pdfStorageUrl = await downloadAndUpload(pub.pdf_url, pdfPath, 'application/pdf')
        } catch (pdfErr) {
          console.warn(`  ⚠ PDF download failed, will store original URL: ${pdfErr.message}`)
          pdfStorageUrl = pub.pdf_url
        }
      }

      // Insert content_item
      const { data: item, error: insertErr } = await supabase
        .from('content_items')
        .insert({
          title: pub.title,
          slug: pub.slug,
          content_type: pub.content_type,
          summary: pub.summary,
          body: pub.body,
          cover_image_url: coverImageUrl,
          cover_image_alt: pub.cover_image_alt || null,
          meta_description: pub.meta_description || null,
          publish_status: 'published',
          visibility: 'public',
          published_at: pub.published_at,
        })
        .select('id')
        .single()

      if (insertErr) throw insertErr
      console.log(`  ✓ Inserted content_item: ${item.id}`)

      // Insert PDF attachment
      const attachmentUrl = pdfStorageUrl || pub.pdf_external_url
      if (attachmentUrl) {
        const { error: attachErr } = await supabase
          .from('content_attachments')
          .insert({
            content_id: item.id,
            file_url: attachmentUrl,
            file_type: 'pdf',
            title: `Download: ${pub.title}`,
          })
        if (attachErr) throw attachErr
        console.log(`  ✓ Attachment linked`)
      }

      inserted++
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
      errors++
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`  Errors: ${errors}`)

  if (errors > 0) process.exit(1)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
