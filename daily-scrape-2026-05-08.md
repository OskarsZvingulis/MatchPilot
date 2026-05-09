# MatchPilot — Daily Job Scrape Report
**Date:** 2026-05-08  
**Run time:** Automated scheduled task  
**Status:** ✅ Complete — data collected via direct API fetches

---

## 🔧 Run Notes

Firecrawl was not used this run. All sources were fetched directly via their public APIs or embedded page data. Infrastructure status:

- **Remotive API** ✅ — fetched directly (`/api/remote-jobs`), 23 jobs returned (fewer than last run — category filter narrowing results)
- **We Work Remotely RSS** ✅ — fetched directly, 25 items
- **Jobicy** ✅ — accessible this run (50 jobs) — bot protection appears temporarily lifted
- **Ashby (Linear)** ✅ — 23 total jobs via `api.ashbyhq.com/posting-api/job-board/linear`
- **Ashby (Clerk)** ✅ — 1 job
- **Ashby (PostHog)** ✅ — **16 jobs — board is BACK** (was returning null on May 6 run)
- **Ashby (Resend)** ✅ — 3 jobs (was 0 last run)
- **Ashby (Raycast, Plain, Infisical, Novu, Liveblocks, Cal.com)** ⚠️ — 0 jobs or 404 (unchanged)
- **Greenhouse (Monzo, Intercom, Vercel, Brex, Duolingo, Cleo)** ✅ — fetched directly via `boards-api.greenhouse.io`
- **Greenhouse (Wise, Starling, Revolut, Curve, Pismo, Checkout.com, Notion, Loom, Plaid, Supabase, PostHog, Linear)** ⚠️ — 404 (companies migrated off Greenhouse, unchanged)
- **Lever** ⚠️ — all monitored slugs returning 404 (unchanged — full audit needed)
- **Reed / Adzuna** ⏭️ — API keys not set in environment

Production ingestion blocker remains: `matchpilot-production-a08d.up.railway.app` is not on the Cowork egress allowlist. Jobs below are ready for manual ingest.

---

## 📦 Source 1: Remotive
*URL: https://remotive.com/api/remote-jobs?category=software-dev&limit=100*

| Title | Company | Location | Remote |
|-------|---------|----------|--------|
| Senior Full-stack React Developer | Lemon.io | Americas, Europe, Asia, Oceania | ✅ |
| Head of Engineering | Lemon.io | USA/European timezones | ✅ |
| Senior DevOps Engineer | Lemon.io | Americas, Europe, Asia, Oceania | ✅ |
| Senior Independent AI Engineer / Architect | A.Team | Americas, Europe, Israel | ✅ |
| Senior Independent Software Developer | A.Team | Americas, Europe, Israel | ✅ |
| AI Engineer | Dry Ground AI | Brazil, Colombia, Philippines | ✅ |
| Senior/Staff Software Engineer (PHP, TS, Rust, Kotlin) | easybill GmbH | Germany | ✅ |
| Tech Lead Full-Stack Rails Engineer | Mitre Media | USA, Canada | ✅ |
| Senior Frontend Developer | Sanctuary Computer | LATAM, Asia | ✅ |
| Fullstack Developer (US - ET) | Chooose | USA | ✅ |
| iOS Developer | nooro | USA | ✅ |

**Notable:** Remotive feed is showing the same core roles as the May 6 run — no significant new additions in the software-dev category. A.Team and Lemon.io continue as evergreen postings. The feed count dropped from 100+ to 23 this run, suggesting Remotive may be cache-refreshing or the category filter is stricter.

---

## 📦 Source 2: We Work Remotely
*URL: https://weworkremotely.com/categories/remote-programming-jobs.rss*

| Title | Company | Posted | Link |
|-------|---------|--------|------|
| Senior AI Engineer / Data Annotator | Lemon.io | 2026-04-10 | [Link](https://weworkremotely.com/remote-jobs/lemon-io-senior-ai-engineer-data-annotator) |
| Senior Frontend Engineer - Product | Feedzai | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/feedzai-senior-frontend-engineer-product) |
| Backend Engineer (TypeScript/Node.js) — DevOps Mindset | Glückliche Gäste | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/gluckliche-gaste-backend-engineer-typescript-node-js-devops-mindset-m-w-d) |
| Senior Full Stack Developer (Go/React) | Mmdsmart Ltd | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/mmdsmart-ltd-senior-full-stack-developer-go-react) |
| Staff AI Product Builder | Brightwheel | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/brightwheel-staff-ai-product-builder) |
| Full-Stack Developer, AI Applications | Titan AI | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/titan-ai-full-stack-developer-ai-applications) |
| Lead Backend Software Engineer (Product API) | Philo | 2026-04-08 | [Link](https://weworkremotely.com/remote-jobs/philo-lead-backend-software-engineer-product-api) |

**New this run:** Backend Engineer (TypeScript/Node.js) at Glückliche Gäste — remote, TypeScript/Node stack with DevOps expectations, EU-based company. Senior Frontend Engineer at Feedzai (fintech fraud detection platform). Senior AI Engineer / Data Annotator at Lemon.io — a new addition from last run.

---

## 📦 Source 3: Ashby (Monitored Companies)

### Linear — 23 total jobs (5 engineering)
| Title | Location | Type | Link |
|-------|----------|------|------|
| Senior / Staff Fullstack Engineer | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) |
| Senior / Staff Fullstack Engineer | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff) |
| Senior / Staff Product Engineer | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/12f8f208-0b9c-4569-bb3d-41c8a197029e) |
| Senior / Staff Product Engineer | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/069c4628-88d7-4e4d-b393-c996fc7f3076) |
| Senior / Staff Product Engineer, AI | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5) |
| Senior / Staff Product Designer | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/a264869e-f058-487c-ab7f-9b77dffa427c) |
| Senior / Staff Product Designer | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/ba8a41d2-4198-481a-a7f4-e09c5364ff7f) |
| Product Manager | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/b7669c4b-eeca-421d-ba9a-d90203f6fcb2) |
| Product Manager | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/86abcce0-04b2-405c-9a8e-e0ca84813914) |
| Account Executive, Growth (EU) | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/59fa48ec-6685-4ab2-a388-6203423811d2) |
| Account Executive, Enterprise (EU) | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/3adaa1f5-2cf1-480d-8daf-92345ec08395) |
| Solutions Engineer, Europe | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/d37b3d76-3080-47f9-8a19-60505573112c) |

**Note:** Linear's board expanded significantly to 23 total roles (up from ~6 last run), with GTM, legal, design, and PM roles now visible in the API. Engineering roles are stable at 5 (same as May 6). The expanded board suggests Linear is actively scaling non-engineering functions.

### Clerk — 1 job
| Title | Location | Type | Link |
|-------|----------|------|------|
| Senior Technical Account Manager | Remote / SF | Remote | [Link](https://jobs.ashbyhq.com/Clerk/cc13322d-892c-4fec-bf9f-07dc605343b3) |

### PostHog — **16 jobs (BOARD RESTORED)**
*Was returning null on the May 6 run. Now fully accessible.*

| Title | Location | Type | Link |
|-------|----------|------|------|
| Backend Engineer — Ingestion | Remote (EMEA) | Remote | [Link](https://jobs.ashbyhq.com/posthog/3f190a45-7810-47f9-b77d-169b806ea266) |
| ClickHouse Operations Engineer | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/43dbf072-0fc1-48c9-8c1e-7416db7d4a14) |
| Product Engineer | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/20ab9628-20ff-4ae3-bd6a-46ae7e9dc6b8) |
| Forward Deployed Engineer | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/28781aeb-eca4-4713-9a5f-a95b95d5d120) |
| AI Research Engineer | Hybrid (UK) | Hybrid | [Link](https://jobs.ashbyhq.com/posthog/8dc3f33a-b930-4c54-b4c4-3e6bd2ff28d3) |
| Site Reliability Engineer | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/1464036f-94d5-4dbd-aef8-fe99246a26d4) |
| Design Engineer | Remote (EMEA) | Remote | [Link](https://jobs.ashbyhq.com/posthog/f90953aa-c0ce-4e87-8a3b-e9163eea52b9) |

**Notable:** PostHog is hiring across a wide range — Backend (Ingestion), ClickHouse infra, Product Engineers, FDE, AI Research, SRE, and Design Engineer. All fully remote except the AI Research role (Hybrid UK). PostHog operates a fully distributed team and is a high-quality open-source analytics company.

### Resend — 3 jobs
| Title | Location | Type | Link |
|-------|----------|------|------|
| Developer Experience Engineer | USA / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/06bd9cb2-d189-41b6-baf7-42bd5da9610f) |
| Backend Engineer, Core Sending | Americas / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/a95832a8-a2ab-4a63-8303-9989f1fc47d6) |
| Customer Success Engineer | Europe / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/f0af27d1-eddd-42b9-a962-f34dc350c390) |

**New this run:** Resend now shows 3 active jobs (was 0 on May 6). Backend Engineer, Core Sending is a direct product-infra role at the email-for-developers platform. TypeScript-heavy stack.

---

## 📦 Source 4: Greenhouse (Monitored Companies)
*Active: Monzo, Intercom, Vercel, Brex, Duolingo, Cleo*
*Inactive/migrated: Wise, Starling Bank, Revolut, Curve, Pismo, Checkout.com, Notion, Loom, Plaid, Supabase, PostHog, Linear*

### Monzo — Engineering (25 engineering roles of 65 total)
*🆕 Barcelona expansion visible this run — 15 new Barcelona/EU roles detected*

| Title | Location | Link |
|-------|----------|------|
| Backend Engineer III | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6635595) |
| Senior Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6635837) |
| Senior Staff Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6036797) |
| Staff Backend Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6636147) |
| Staff Backend Engineer | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/6656228) |
| Senior Software Engineer | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/6656737) |
| Software Engineer II | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7065636) |
| Software Engineer III | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/6758449) |
| Senior Web Engineer | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7672592) |
| Android Engineer | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7343996) |
| Platform Engineer | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6699672) |
| Platform Engineer, Machine Learning | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7118972) |
| Lead Analytics Engineer, Borrowing | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7873998) |
| Lead Data Scientist | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6369658) |
| Lead Data Scientist | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7457551) |
| Senior Data Scientist | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6180814) |
| Senior Machine Learning Scientist, Borrowing | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7686352) |
| Machine Learning Manager, Borrowing | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/7766052) |
| Engineering Manager | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/5018066) |
| Engineering Manager | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/6945371) |
| Senior Engineering Manager | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6394676) |
| Senior Analytics Engineering Manager | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7775035) |

**Notable:** Monzo's Barcelona engineering hub is now clearly visible — 15 Barcelona/EU roles detected vs. none last run. This is a significant geographic expansion. The UK remote roles are unchanged. New ML focus evident: Machine Learning Manager, Platform Engineer ML, ML Scientist all added.

### Intercom — Engineering (94 engineering roles of 173 total)
*Key new roles since May 6:*

| Title | Location | Link |
|-------|----------|------|
| AI Infrastructure Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824137) |
| AI Infrastructure Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7820671) |
| AI Infrastructure Engineer | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824142) |
| Engineering Manager, AI Models Infrastructure | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7818586) |
| Engineering Manager, AI Models Infrastructure | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7818585) |
| Engineering Manager, AI Models Infrastructure | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7818588) |
| Engineering Manager, AI Models Infrastructure | London/Dublin/Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7784684) |
| Senior Engineering Manager, Fin AI Agent | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825844) |
| Senior Engineering Manager, Fin AI Agent | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825825) |
| Senior Engineering Manager, Fin AI Agent | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825849) |
| Principal Engineer, Fin AI Agent | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7725840) |
| Principal Engineer, Fin AI Agent | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7742203) |
| Principal Engineer, Fin AI Agent | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7725837) |
| Principal Engineer - Go-To-Market | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7811880) |
| Principal Engineer - Go-To-Market | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7814380) |
| Staff Product Engineer, AI | Dublin/London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7383950) |
| Staff Product Engineer, AI | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7393922) |
| Staff Product Engineer, AI | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7393950) |
| Staff Product Engineer, AI | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7393955) |
| Senior Product Engineer, AI | Dublin/London | [Link](https://job-boards.greenhouse.io/intercom/jobs/6276021) |
| Senior Product Engineer, AI Platform | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/6466001) |
| Forward Deployed Software Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7556413) |
| Staff Forward Deployed Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7462110) |
| Staff Forward Deployed Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7310770) |
| Engineering Manager, Forward Deployed Engineering | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7765466) |
| Engineering Manager, Forward Deployed Engineering | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7749413) |

**Notable:** Intercom has massively scaled AI hiring. 4 new Engineering Manager roles for AI Models Infrastructure (all 3 cities + combined), 3 new Senior EM roles for Fin AI Agent, and Principal Engineer Go-To-Market is a new functional area (2 openings). This signals a major AI infra build-out around Fin.

### Vercel — Engineering (42 engineering roles of 84 total)
*New roles since May 6:*

| Title | Location | Link |
|-------|----------|------|
| Software Engineer, AI SDK | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5474915004) |
| Software Engineer, AI Gateway | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5798406004) |
| Software Engineer, Agent | SF (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5704320004) |
| Software Engineer, Backend | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5430088004) |
| Software Engineer, Backend | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5431123004) |
| Software Engineer, CDN | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5179639004) |
| Software Engineer, CDN Security | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5473266004) |
| Software Engineer, Compute | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5551619004) |
| Software Engineer, Dashboard | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5808568004) |
| Software Engineer, Deployment Infrastructure | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5633880004) |
| Software Engineer, Domains | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5813134004) |
| Software Engineer, Growth | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5613601004) |
| Software Engineer, Lua | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5661583004) |
| Software Engineer, Workflows | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5798416004) |
| Anti-Abuse Automation Engineer | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5843010004) |
| Senior Software Engineer, Trust & Safety | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5788954004) |
| Design Engineer | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5709080004) |
| Mobile Engineer | Hybrid - NYC | [Link](https://job-boards.greenhouse.io/vercel/jobs/5719796004) |
| Forward Deployed Engineer, v0 | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5872425004) |
| Forward-Deployed Engineer (EU) | London / Berlin (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5778418004) |
| Developer Success Engineer | Remote - UK / Germany | [Link](https://job-boards.greenhouse.io/vercel/jobs/5530586004) |
| Senior Customer Support Engineer | Remote - UK | [Link](https://job-boards.greenhouse.io/vercel/jobs/5818258004) |

**🆕 New since May 6:** Software Engineer Lua (edge runtime work), Software Engineer CDN Security, Software Engineer Deployment Infrastructure, Anti-Abuse Automation Engineer, Mobile Engineer (NYC Hybrid), Sr Engineering Manager Platform.

### Brex — Engineering (selected roles)
| Title | Location | Link |
|-------|----------|------|
| Senior Software Engineer, Frontend | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8501052002) |
| Senior Software Engineer, Full Stack | SF / Seattle / Vancouver / NYC / São Paulo | [Link](https://www.brex.com/careers/8472635002) |
| Senior Software Engineer, AI - Simulation | SF / Seattle | [Link](https://www.brex.com/careers/8442494002) |
| Senior Software Engineer, Product | SF / Seattle / NYC | [Link](https://www.brex.com/careers/8461469002) |
| Senior Software Engineer, Product Data Platform | SF / Seattle / Vancouver | [Link](https://www.brex.com/careers/8430182002) |
| Software Engineer, Forward Deployed Agent Builder | Seattle / São Paulo | [Link](https://www.brex.com/careers/8523205002) |
| Application Security Engineer | Remote | [Link](https://www.brex.com/careers/8534944002) |
| Engineering Manager, AI — Brex Assistant | SF / Seattle | [Link](https://www.brex.com/careers/8393583002) |
| Engineering Manager, Cloud Infrastructure | SF / NYC / Seattle | [Link](https://www.brex.com/careers/8534633002) |
| Engineering Manager, Onboarding | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8461600002) |

**🆕 New since May 6:** Software Engineer Forward Deployed Agent Builder, Engineering Manager AI — Brex Assistant, Engineering Manager Cloud Infrastructure, Engineering Manager Onboarding all appear new. Brex is scaling AI agent capabilities ("Brex Assistant").

### Duolingo — Engineering (selected roles)
| Title | Location | Link |
|-------|----------|------|
| Staff AI Research Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8525406002) |
| Senior Software Engineer, Backend | Seattle, WA | [Link](https://careers.duolingo.com/jobs/8457170002) |
| Senior Software Engineer, Chess | New York, NY | [Link](https://careers.duolingo.com/jobs/8445379002) |
| Senior Android Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8215862002) |
| Senior iOS Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8393272002) |
| Platform Engineer II | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8449895002) |
| Senior Platform Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8449936002) |
| Engineering Manager, Notifications | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8468545002) |
| Senior Engineering Manager, Monetization | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8534630002) |
| Director of Data Science & Analytics, User Growth | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8508337002) |

**Notable:** Staff AI Research Engineer is a new listing at Duolingo. Senior Engineering Manager Monetization also appears new. Duolingo continues hiring across product engineering, mobile, and platform — mostly Pittsburgh/NYC in-person.

### Cleo — Engineering
| Title | Location | Link |
|-------|----------|------|
| AI Product Manager | Remote - USA | [Link](https://job-boards.greenhouse.io/cleo/jobs/4664509005) |
| Cloud Security Lead | Remote US | [Link](https://job-boards.greenhouse.io/cleo/jobs/4674041005) |
| Solutions Architect | Remote - USA | [Link](https://job-boards.greenhouse.io/cleo/jobs/4666306005) |

---

## 📦 Source 5: Jobicy
*URL: https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineer*
*✅ Accessible this run (was bot-blocked on May 6)*

| Title | Company | Location |
|-------|---------|----------|
| Staff Software Engineer – Kubernetes Operations | Marqeta | USA |
| Staff AI Builder (AI Native Mobile Engineer) | Life360 | USA |
| Senior AI Platform Engineer | Samsara | Canada |
| Cloud Security Engineer | Stripe | USA |
| Staff Machine Learning Engineer | Headspace | USA |
| Back-End Engineer, AI | Deel | Romania |
| Senior Software Engineer (Sustaining Automation) | Chainguard | Canada, Europe, USA |
| Engineering Manager | Catawiki | Netherlands |
| Sales Engineer | Astronomer | USA |
| Principal Presales Engineer (CDP/Martech/AI) | Twilio | UK |

**Notable:** Stripe's Cloud Security Engineer is a high-quality remote opportunity. Deel's Back-End Engineer, AI in Romania is accessible for EU candidates. Chainguard (supply chain security) is hiring globally for their automation platform.

---

## 🆕 Changes vs. May 6 Run (What's New)

| Change | Detail |
|--------|--------|
| 🟢 PostHog Ashby board restored | 16 jobs now live — was null last run. PostHog confirmed on Ashby, update watchlist |
| 🟢 Resend board active | 3 jobs now showing (was 0 last run) |
| 🟢 Jobicy accessible | 50 jobs fetched (was bot-blocked last run) |
| 🟢 Monzo Barcelona expansion | 15 new Barcelona/EU roles detected — Monzo engineering hub confirmed |
| 🟢 Intercom AI Models Infra hiring surge | 4 new Engineering Manager AI Models Infrastructure roles, 3 new Senior EM Fin AI Agent |
| 🟢 Vercel new roles | Lua engineer, CDN Security, Deployment Infra, Anti-Abuse, Mobile (NYC) |
| 🟢 Brex AI push | Engineering Manager AI — Brex Assistant, Forward Deployed Agent Builder roles new |
| 🟢 Duolingo Staff AI Research Engineer | New senior AI research listing at Duolingo (Pittsburgh) |
| 🟡 Linear GTM expansion | 23 total roles vs. ~6 last run — engineering count stable, GTM/design/legal scaling |
| 🔴 Lever all 404 | Still no resolution — needs full watchlist audit |

---

## 🏆 Top Picks (High Signal Roles)

These roles best match a TypeScript / React / Node.js fullstack engineering profile:

1. **PostHog — Product Engineer** · Ashby · Remote — PostHog board is back and this is their core IC product engineering role at a beloved open-source analytics company. [Apply](https://jobs.ashbyhq.com/posthog/20ab9628-20ff-4ae3-bd6a-46ae7e9dc6b8)

2. **PostHog — Backend Engineer, Ingestion** · Ashby · Remote (EMEA) — data pipeline engineering at scale; PostHog handles billions of events and this team owns the hot path. [Apply](https://jobs.ashbyhq.com/posthog/3f190a45-7810-47f9-b77d-169b806ea266)

3. **Linear — Senior/Staff Product Engineer, AI** · Ashby · Remote, North America — the highest-signal engineering role on the watchlist; Linear's AI product work. [Apply](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5)

4. **Linear — Senior/Staff Fullstack Engineer** · Ashby · Remote, EU or North America — evergreen high-bar role with both EU and NA variants open. [Apply (NA)](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) · [Apply (EU)](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff)

5. **Vercel — Software Engineer, AI SDK** · Greenhouse · SF/NYC Hybrid — core AI tooling work at the platform behind Next.js. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5474915004)

6. **Vercel — Software Engineer, Agent** · Greenhouse · SF Hybrid — new role building Vercel's agentic product layer. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5704320004)

7. **Intercom — Staff Product Engineer, AI** · Greenhouse · Dublin/London/Berlin — Staff-level AI product engineering at a scaled SaaS. [Apply](https://job-boards.greenhouse.io/intercom/jobs/7383950)

8. **Resend — Backend Engineer, Core Sending** · Ashby · Americas Remote — small team, high-impact infrastructure work on a TypeScript-native email platform. [Apply](https://jobs.ashbyhq.com/resend/a95832a8-a2ab-4a63-8303-9989f1fc47d6)

9. **PostHog — Design Engineer** · Ashby · Remote (EMEA) — product + design engineering hybrid role; rare opening at a company known for quality UI. [Apply](https://jobs.ashbyhq.com/posthog/f90953aa-c0ce-4e87-8a3b-e9163eea52b9)

10. **Monzo — Senior Staff Backend Engineer** · Greenhouse · Remote (UK) — Staff+ level at a top-tier UK fintech with strong engineering culture. [Apply](https://job-boards.greenhouse.io/monzo/jobs/6036797)

11. **Glückliche Gäste — Backend Engineer (TypeScript/Node.js)** · WWR · Remote — TypeScript/Node fullstack with DevOps expectations; new this run. [Apply](https://weworkremotely.com/remote-jobs/gluckliche-gaste-backend-engineer-typescript-node-js-devops-mindset-m-w-d)

12. **Stripe — Cloud Security Engineer** · Jobicy · Remote (USA) — Stripe is a marquee name; security engineering at payment infrastructure scale. [Apply via Jobicy](https://jobicy.com)

---

## ⚠️ Source Health Issues (Action Required)

| Priority | Issue | Action |
|----------|-------|--------|
| 🔴 High | Lever: all 16 company slugs returning 404 | Audit and replace Lever company list — these companies have moved to Greenhouse, Ashby, Rippling, or custom boards |
| 🟡 Medium | Greenhouse: 12 of 18 companies returning 404 (Wise, Revolut, Notion, Supabase, etc.) | Update Greenhouse slugs or find new ATS URLs for migrated companies |
| 🟡 Medium | Production ingest URL blocked by Cowork egress filter | Whitelist `matchpilot-production-a08d.up.railway.app` in Settings → Capabilities to enable automated ingestion |
| 🟡 Medium | PostHog Ashby board confirmed working — update source health notes | Remove "null board" warning, add to active Ashby list |
| 🟢 Low | Remotive returning only 23 jobs vs 100+ on prior runs | Check if category=software-dev filter tightened or if API changed pagination |
| 🟢 Low | Jobicy accessible today — monitor consistency | Add delay/fallback headers in case bot protection returns |
| 🟢 Low | Reed/Adzuna keys missing | Add `REED_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_API_KEY` to `.env.local` |

---

*Report generated by MatchPilot scheduled task · 2026-05-08*
