# MatchPilot — Daily Job Scrape Report
**Date:** 2026-05-06  
**Run time:** Automated scheduled task  
**Status:** ✅ Complete — data collected via direct API fetches

---

## 🔧 Run Notes

Firecrawl was not used this run. All sources were fetched directly via their public APIs or embedded page data. Infrastructure status:

- **Remotive API** ✅ — fetched directly (`/api/remote-jobs`)
- **We Work Remotely RSS** ✅ — fetched directly
- **Jobicy** ⚠️ — bot-protected (reCAPTCHA), skipped
- **Ashby (Linear, Clerk)** ✅ — jobs extracted from embedded `window.__appData` JSON
- **Ashby (PostHog, resend, raycast, novu, etc.)** ⚠️ — slugs returning null jobBoard; PostHog has likely migrated off Ashby
- **Greenhouse (Monzo, Intercom, Vercel, Brex, Duolingo, Cleo)** ✅ — fetched directly via `boards-api.greenhouse.io`
- **Greenhouse (Wise, Starling, Revolut, Curve, Pismo, Checkout.com, Notion, Loom, Plaid, Supabase, Linear, Posthog)** ⚠️ — 404 (companies have migrated off Greenhouse)
- **Lever** ⚠️ — all monitored slugs returning 404 (companies migrated off Lever)
- **Reed / Adzuna** ⏭️ — API keys not set in environment

Production ingestion blocker remains: `matchpilot-production-a08d.up.railway.app` is not on the Cowork egress allowlist. Jobs below are ready for manual ingest.

---

## 📦 Source 1: Remotive
*URL: https://remotive.com/api/remote-jobs?category=software-dev&limit=100*

| Title | Company | Location | Remote |
|-------|---------|----------|--------|
| Senior Full-stack React Developer | Lemon.io | Americas, Europe, Asia, Oceania | ✅ |
| Head of Engineering | Lemon.io | USA / European timezones | ✅ |
| Senior DevOps Engineer | Lemon.io | Americas, Europe, Asia, Oceania | ✅ |
| Senior Frontend Developer | Sanctuary Computer | LATAM, Asia | ✅ |
| Fullstack Developer (US - ET) | Chooose | USA | ✅ |
| Senior Independent AI Engineer / Architect | A.Team | Americas, Europe, Israel | ✅ |
| Senior Independent Software Developer | A.Team | Americas, Europe, Israel | ✅ |
| AI Engineer | Dry Ground AI | Brazil, Colombia, Philippines | ✅ |
| Senior/Staff Software Engineer (PHP, TS, Rust, Kotlin) | easybill GmbH | Germany | ✅ |
| Tech Lead Full-Stack Rails Engineer | Mitre Media | USA, Canada | ✅ |

**Notable:** Lemon.io has 3 open roles. A.Team is an ongoing network-sourced board — high $$/hr potential. Chooose is a climate-tech company using React/TypeScript.

---

## 📦 Source 2: We Work Remotely
*URL: https://weworkremotely.com/categories/remote-programming-jobs.rss*

| Title | Company | Posted | Link |
|-------|---------|--------|------|
| Senior Full Stack Developer (Go/React) | Mmdsmart Ltd | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/mmdsmart-ltd-senior-full-stack-developer-go-react) |
| Staff AI Product Builder | Brightwheel | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/brightwheel-staff-ai-product-builder) |
| Full-Stack Developer, AI Applications | Titan AI | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/titan-ai-full-stack-developer-ai-applications) |
| Lead Backend Software Engineer (Product API) | Philo | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/philo-lead-backend-software-engineer-product-api) |
| Full Stack Developer - Backend Focus | 31 Green Ltd | 2026-04-07 | [Link](https://weworkremotely.com/remote-jobs/31-green-ltd-full-stack-developer-backend-focus) |
| Full-stack Developer (SP) | act digital | 2026-04-07 | [Link](https://weworkremotely.com/remote-jobs/act-digital-full-stack-developer-sp) |
| Senior Backend Application Engineer | Manifest Cyber | 2026-04-07 | [Link](https://weworkremotely.com/remote-jobs/manifest-cyber-public-senior-backend-application-engineer-product-platform) |
| Full-stack/Backend Developers (LLM focused) | CloudDevs | 2026-04-07 | [Link](https://weworkremotely.com/remote-jobs/clouddevs-full-stack-backend-developers-llm-focused) |
| Software Engineer, Web Core & Chrome Extension | Speechify | 2026-04-06 | [Link](https://weworkremotely.com/remote-jobs/speechify-software-engineer-web-core-product-chrome-extension) |
| Senior Independent Software Developer ($90–$170/hr) | A.Team | (evergreen) | [Link](https://weworkremotely.com/remote-jobs/a-team-senior-independent-software-developer-90-170-hr) |

**Notable:** Brightwheel Staff AI Product Builder is a senior builder role at an EdTech unicorn. Speechify Web Core role spans web + Chrome Extension — good scope. A.Team's $90–$170/hr evergreen posting continues.

---

## 📦 Source 3: Ashby (Monitored Companies)
*Companies checked: linear, clerk, posthog, resend, raycast, novu, liveblocks, plain, knock, infisical, triggerdev, cal.com*

### Linear
| Title | Location | Type | Link |
|-------|----------|------|------|
| Senior / Staff Fullstack Engineer | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) |
| Senior / Staff Fullstack Engineer | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff) |
| Senior / Staff Product Engineer | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/12f8f208-0b9c-4569-bb3d-41c8a197029e) |
| Senior / Staff Product Engineer | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/069c4628-88d7-4e4d-b393-c996fc7f3076) |
| Senior / Staff Product Engineer, AI | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5) |
| Solutions Engineer, Europe | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/d37b3d76-3080-47f9-8a19-60505573112c) |

### Clerk
| Title | Location | Type | Link |
|-------|----------|------|------|
| Senior Technical Account Manager | Remote / SF | Remote | [Link](https://jobs.ashbyhq.com/Clerk/cc13322d-892c-4fec-bf9f-07dc605343b3) |

**Note:** PostHog's Ashby board (`jobs.ashbyhq.com/posthog`) is returning a null board — they appear to have migrated or hidden their job board. Verify at https://posthog.com/careers directly.

**Notable:** Linear now has **5 open engineering roles** (up from 1 last run) — a significant expansion. Senior/Staff Product Engineer, AI is a new addition since April. Linear remains one of the highest-quality remote engineering targets in the watchlist.

---

## 📦 Source 4: Greenhouse (Monitored Companies)
*Active: Monzo, Intercom, Vercel, Brex, Duolingo, Cleo*
*Inactive/migrated: Wise, Starling Bank, Revolut, Curve, Pismo, Checkout.com, Notion, Loom, Plaid, Supabase, PostHog, Linear*

### Monzo — Engineering
| Title | Location | Link |
|-------|----------|------|
| Backend Engineer III | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6635595) |
| Principal Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7835940) |
| Senior Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6635837) |
| Senior Staff Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6036797) |
| Senior Staff Software Engineer, AI Customer Operations | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7613712) |
| Staff Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6636147) |
| Platform Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6699672) |
| Lead Analytics Engineer, Borrowing | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7873998) |
| Engineering Manager | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/5018066) |

### Intercom — Engineering
| Title | Location | Link |
|-------|----------|------|
| AI Infrastructure Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824137) |
| AI Infrastructure Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7820671) |
| AI Infrastructure Engineer | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824142) |
| Senior Product Engineer, AI | Dublin / London | [Link](https://job-boards.greenhouse.io/intercom/jobs/6276021) |
| Senior Product Engineer, AI Platform | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/6466001) |
| Staff Product Engineer, AI | Dublin / London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7383950) |
| Staff Product Engineer, AI | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7393922) |
| Senior Full Stack Engineer - Team Web | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7274831) |
| Senior Full Stack Engineer - Team Web | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7276257) |
| Principal Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/6386427) |
| Principal Engineer, Fin AI Agent | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7725837) |
| Forward Deployed Software Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7556413) |
| Senior Forward Deployed Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7218259) |
| Software Engineer | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7371989) |
| Technical Support Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/6436276) |

### Vercel — Engineering
| Title | Location | Link |
|-------|----------|------|
| Software Engineer, AI SDK | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5474915004) |
| Software Engineer, AI Gateway | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5798406004) |
| Software Engineer, Agent | SF (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5704320004) |
| Software Engineer, Backend | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5430088004) |
| Software Engineer, Compute | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5551619004) |
| Software Engineer, Domains | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5813134004) |
| Software Engineer, Dashboard | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5808568004) |
| Software Engineer, CDN | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5179639004) |
| Software Engineer, Growth | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5613601004) |
| Software Engineer, Workflows | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5798416004) |
| Forward-Deployed Engineer (EU) | London / Berlin (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5778418004) |
| Forward Deployed Engineer, v0 | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5872425004) |
| Design Engineer | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5709080004) |
| Senior Software Engineer, Trust & Safety | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5788954004) |
| Developer Success Engineer | Remote - UK / Germany | [Link](https://job-boards.greenhouse.io/vercel/jobs/5530586004) |
| Senior Customer Support Engineer | Remote - UK | [Link](https://job-boards.greenhouse.io/vercel/jobs/5818258004) |

### Brex — Engineering
| Title | Location | Link |
|-------|----------|------|
| Senior Software Engineer, Frontend | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8501052002) |
| Senior Software Engineer, Full Stack | SF / Seattle / Vancouver | [Link](https://www.brex.com/careers/8472635002) |
| Senior Software Engineer, AI - Simulation | SF / Seattle | [Link](https://www.brex.com/careers/8442494002) |
| Frontend Engineer II | SF / Seattle | [Link](https://www.brex.com/careers/8478372002) |
| Application Security Engineer | Remote | [Link](https://www.brex.com/careers/8534944002) |

### Lever (All Monitored Companies)
⚠️ All 16 monitored Lever companies returned HTTP 404. Companies have migrated away from Lever since the watchlist was created. Recommended action: audit the Lever company list and update slugs or find new job board URLs for: Contentful, Netlify, Elastic, Shopify, Auth0, Twilio, Heap, Bitrise, Miro, Hotjar, Personio, Pleo, Deliveroo, Babylon, TransferWise (now Wise), BeReal.

---

## 🏆 Top Picks (High Signal Roles)

These roles best match a TypeScript / React / Node.js fullstack engineering profile:

1. **Linear — Senior/Staff Product Engineer, AI** · Ashby · Remote, North America — new AI-focused eng role at the most-coveted tooling company on the watchlist. [Apply](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5)
2. **Linear — Senior/Staff Fullstack Engineer** · Ashby · Remote, EU or North America — evergreen high-bar role, now with EU variant open too. [Apply (NA)](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) · [Apply (EU)](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff)
3. **Vercel — Software Engineer, AI SDK** · Greenhouse · SF/NYC Hybrid — core AI tooling work at the platform behind Next.js. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5474915004)
4. **Intercom — Staff Product Engineer, AI** · Greenhouse · Dublin/London/Berlin — Staff-level AI product engineering at a scaled SaaS with real AI traction. [Apply](https://job-boards.greenhouse.io/intercom/jobs/7383950)
5. **Intercom — AI Infrastructure Engineer** · Greenhouse · London/Dublin/Berlin — Infrastructure role enabling Fin AI, hiring across 3 EU cities. [Apply (London)](https://job-boards.greenhouse.io/intercom/jobs/7824137)
6. **Monzo — Senior Staff Software Engineer, AI Customer Operations** · Greenhouse · Remote (UK) — Staff+ level, AI-focused, highest seniority at a top-tier UK fintech. [Apply](https://job-boards.greenhouse.io/monzo/jobs/7613712)
7. **Vercel — Forward Deployed Engineer, v0** · Greenhouse · Remote US — v0 is Vercel's generative UI product; FDE role is a rare opening. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5872425004)
8. **Brightwheel — Staff AI Product Builder** · WWR · Remote — hands-on builder role at a well-funded EdTech company leaning into AI. [Apply](https://weworkremotely.com/remote-jobs/brightwheel-staff-ai-product-builder)
9. **Lemon.io — Senior Full-stack React Developer** · Remotive · Global Remote — high-volume matching platform, global reach, TypeScript/React/Next.js stack. [Apply](https://remotive.com/remote-jobs/software-development/senior-full-stack-react-developer-2088711)
10. **Speechify — Software Engineer, Web Core & Chrome Extension** · WWR · Remote — interesting technical scope (web + extension), consumer product. [Apply](https://weworkremotely.com/remote-jobs/speechify-software-engineer-web-core-product-chrome-extension)

---

## ⚠️ Source Health Issues (Action Required)

| Priority | Issue | Action |
|----------|-------|--------|
| 🔴 High | Lever: all 16 company slugs returning 404 | Audit and replace Lever company list — these companies have moved to Greenhouse, Ashby, Rippling, or custom boards |
| 🔴 High | PostHog Ashby board returning null | Verify PostHog's current job board URL at https://posthog.com/careers and update the slug |
| 🟡 Medium | Greenhouse: 12 of 18 companies returning 404 (Wise, Revolut, Notion, Supabase, etc.) | Update Greenhouse slugs or find new ATS URLs for migrated companies |
| 🟡 Medium | Production ingest URL blocked by Cowork egress filter | Whitelist `matchpilot-production-a08d.up.railway.app` in Settings → Capabilities to enable automated ingestion |
| 🟢 Low | Jobicy blocked by bot protection | Switch Jobicy to their RSS feed (`jobicy.com/feed`) if available, or add delay/headers |
| 🟢 Low | Reed/Adzuna keys missing | Add `REED_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_API_KEY` to `.env.local` |

---

*Report generated by MatchPilot scheduled task · 2026-05-06*
