# MatchPilot — Daily Job Scrape Report
**Date:** 2026-04-27  
**Run time:** Automated scheduled task  
**Status:** ⚠️ Partial — data collected via web search (see blockers below)

---

## 🔧 Run Notes

The full firecrawl-ingest.mjs script could not be executed this run due to two infrastructure blockers:

1. **Firecrawl credits exhausted** — The Firecrawl MCP returned `Insufficient credits` on all scrape attempts. Top up credits at https://firecrawl.dev/pricing to restore full pipeline operation.
2. **Production URL not on sandbox allowlist** — `matchpilot-production-a08d.up.railway.app` is blocked by the Cowork egress filter. Jobs cannot be POSTed to `/api/ingest` from this environment. The user can whitelist it in **Settings → Capabilities**, or trigger the ingest script manually from a local terminal.

Jobs data below was collected via web search across all monitored sources and is ready to be cross-referenced or manually ingested.

---

## 📦 Source 1: Remotive
*URL: https://remotive.com/api/remote-jobs?category=software-dev&limit=100*

| Title | Company | Stack | Remote |
|-------|---------|-------|--------|
| Fullstack Developer | Wynwood Tech | TypeScript, React, Next.js, Node.js | ✅ |
| Team Lead (ReactJS / Node.js) | Playbook | TypeScript, React, Node.js | ✅ |
| Senior Full-stack React Developer | Lemon.io | React, Next.js, TypeScript, AWS/Supabase | ✅ |
| Full-Stack Developer | Spidergap | JavaScript, Node.js, React | ✅ |

**Notable:** Playbook Team Lead pays $120–$170/hr. Lemon.io hiring across Americas, Europe, Asia, Oceania.

---

## 📦 Source 2: We Work Remotely
*URL: https://weworkremotely.com/categories/remote-programming-jobs.rss*

| Title | Company | Stack | Remote |
|-------|---------|-------|--------|
| Senior Full-Stack TypeScript Engineer (NestJS + React) | Enrollio | NestJS, React, TypeScript | ✅ |
| Senior Frontend Engineer (React / Next.js) | Knack | JavaScript, TypeScript, React, CSS | ✅ |
| Senior React Full-stack Developer | Lemon.io | React, Next.js, TypeScript, AWS | ✅ |
| Full-stack Developer (React & Node.js) | Master-works | React, Node.js | ✅ |
| Full Stack Developer (.NET & React) | Manila Recruitment | React, Redux, TypeScript, .NET | ✅ |
| Senior Frontend Engineer (React, TypeScript) | Paperpile | React, TypeScript, React Native, Electron | ✅ |
| Senior Fullstack Developer | Zencastr | Node.js, React, TypeScript | ✅ |
| Senior Typescript + React Developer | Oxidian | TypeScript, React | ✅ |
| Senior Full Stack JavaScript Engineer (4-day week) | Stack Influence | JavaScript | ✅ |

**Notable:** Paperpile role spans web, mobile (React Native), and desktop (Electron). Stack Influence offers 4-day work week.

---

## 📦 Source 3: Ashby (Monitored Companies)
*Companies: vercel, linear, clerk, posthog, resend, novu, liveblocks, raycast, plain, incident.io, sequin, knock, infisical, trigger.dev, cal.com*

### PostHog — Most Active Hiring
| Title | Link |
|-------|------|
| Product Engineer | https://jobs.ashbyhq.com/posthog/20ab9628-20ff-4ae3-bd6a-46ae7e9dc6b8 |
| AI Product Engineer | https://jobs.ashbyhq.com/posthog/bd597451-e465-46f6-857f-befe28366f20 |
| Product Engineer - Web Analytics | https://jobs.ashbyhq.com/posthog/c5e676fd-20e2-4564-8e49-b696bfde8c1c |
| Software Engineer - Data Warehouse | https://jobs.ashbyhq.com/posthog/750e6829-fbfe-4c7d-83d6-dd4f0841f066 |
| Software Engineer — Data Stack Tooling | https://jobs.ashbyhq.com/posthog/4aa79efe-85bf-416a-b531-ae454005206b |
| Software Engineer — Data Stack — Hog/QL | https://jobs.ashbyhq.com/posthog/d61fd246-822c-4c95-b421-88b943e21fd2 |
| Software Engineer — Warehouse Pipelines | https://jobs.ashbyhq.com/posthog/ea680eac-c4bc-44e1-85eb-8191d1d7d4e0 |
| Technical Support Engineer | https://jobs.ashbyhq.com/posthog/db808740-242e-4a40-ad43-d41f26c049d7 |
| Technical Support Engineer (Singapore) | https://jobs.ashbyhq.com/posthog/2b581b85-51b3-4fb6-a3a2-b49bb78a94aa |
| Backend Engineer — Ingestion | https://jobs.ashbyhq.com/posthog/3f190a45-7810-47f9-b77d-169b806ea266 |
| Forward Deployed Engineer | https://jobs.ashbyhq.com/posthog/28781aeb-eca4-4713-9a5f-a95b95d5d120 |

### Linear
| Title | Link |
|-------|------|
| Senior / Staff Fullstack Engineer | https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32 |

### Trigger.dev
| Title | Link |
|-------|------|
| Jobs page (check for current openings) | https://jobs.ashbyhq.com/triggerdev |

**Notable:** PostHog is the most aggressively hiring across this cohort with 11+ open roles. Linear has a Senior/Staff Fullstack Engineer open — rare opening for that company.

---

## 📦 Source 4: Greenhouse (Monitored Companies)
*Companies: monzo, wise, starling-bank, cleo, revolut, curve, pismo, checkout-com, duolingo, intercom, notion, loom, plaid, brex, vercel, supabase, posthog, linear*

### Monzo
| Title | Salary | Location | Link |
|-------|--------|----------|------|
| Senior Staff Engineer - Platform | £135k–£184k + equity | London / UK Remote | https://job-boards.greenhouse.io/monzo/jobs/7430989 |
| Backend Engineer III | £78k–£110k | London / UK Remote | https://job-boards.greenhouse.io/monzo/jobs/6635595 |
| Platform Engineer | £95k–£130k + equity | London / UK Remote | https://job-boards.greenhouse.io/monzo/jobs/6699672 |
| Associate Software Engineer (Intern) | — | London | https://job-boards.greenhouse.io/monzo/jobs/7171396 |

### Intercom
| Title | Link |
|-------|------|
| Software Engineer | https://job-boards.greenhouse.io/intercom/jobs/7371989 |
| AI Infrastructure Engineer | https://job-boards.greenhouse.io/intercom/jobs/7820671 |

### Vercel
| Title | Link |
|-------|------|
| Software Engineer, Vercel Marketplace | https://job-boards.greenhouse.io/vercel/jobs/5387745004 |

**Notable:** Monzo Senior Staff Engineer pays up to £184k — highest comp in this batch. Intercom AI Infrastructure Engineer is a new AI-focused role.

---

## 📦 Source 5: Lever (Monitored Companies)
*Companies: contentful, netlify, elastic, shopify, auth0, twilio, heap, bitrise, miro, hotjar, personio, pleo, deliveroo, babylon, transfer-wise, bereal*

| Title | Company | Stack | Link |
|-------|---------|-------|------|
| Senior Frontend Developer (Shopify, React) | Smart Working Solutions | Shopify, React | https://jobs.lever.co/smart-working-solutions/7bd22f0e |
| Senior React Frontend Engineer | Smart Working Solutions | React, TypeScript, Contentful | https://jobs.lever.co/smart-working-solutions/02648d73 |
| Contentful CMS Developer | Thrillworks | Contentful, Headless CMS | https://jobs.lever.co/thrillworks/49eb9713 |
| Full Stack Web Engineer (Remote) | Jobgether | Full Stack | https://jobs.lever.co/jobgether/4013e2fc |
| Senior Front-End Engineer | Offchain Labs | React, TypeScript, Headless CMS | https://jobs.lever.co/offchainlabs/76395f49 |

---

## 📦 Sources 6–8: Reed / Adzuna / Jobicy
*Status: Could not scrape this run (network restrictions). Reed requires `REED_API_KEY` env var; Adzuna requires `ADZUNA_APP_ID` + `ADZUNA_API_KEY`.*

---

## 🏆 Top Picks (High Signal Roles)

These roles best match the TypeScript/React/Node.js engineering profile most relevant to MatchPilot's scoring criteria:

1. **Linear — Senior/Staff Fullstack Engineer** · Ashby · Remote-first, rare opening at a high-quality tooling company
2. **PostHog — AI Product Engineer** · Ashby · AI-native product work, globally remote, GMT-8 to GMT+2
3. **Monzo — Senior Staff Engineer (Platform)** · Greenhouse · £135–184k, UK/remote, high comp ceiling
4. **Intercom — AI Infrastructure Engineer** · Greenhouse · AI-focused infra role at a mature SaaS co
5. **Paperpile — Senior Frontend Engineer (React/TypeScript)** · WWR · Cross-platform (web + mobile + desktop), interesting scope
6. **Vercel — Software Engineer, Marketplace** · Greenhouse · Core infra team at the leading Next.js deployment platform
7. **PostHog — Technical Support Engineer** · Ashby · Great entry point into a top-tier remote-first eng culture
8. **Zencastr — Senior Fullstack Developer** · WWR · Node.js + React + TypeScript full stack

---

## ⚡ Action Items

| Priority | Action |
|----------|--------|
| 🔴 High | Top up Firecrawl credits to restore automated ingestion pipeline |
| 🔴 High | Whitelist `matchpilot-production-a08d.up.railway.app` in Cowork Settings → Capabilities so the scheduler can POST jobs to `/api/ingest` |
| 🟡 Medium | Run `FIRECRAWL_API_KEY=xxx INGEST_URL=https://matchpilot-production-a08d.up.railway.app WORKER_SECRET=3eb2bf26... node scripts/firecrawl-ingest.mjs` locally to catch up on missed ingestion |
| 🟢 Low | Add `REED_API_KEY` to `.env.local` to enable Reed source (TypeScript, React, Next.js, Node.js keyword searches) |

---

*Report generated by MatchPilot scheduled task · 2026-04-27*
