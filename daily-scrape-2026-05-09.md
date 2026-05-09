# MatchPilot — Daily Job Scrape Report
**Date:** 2026-05-09  
**Run time:** Automated scheduled task  
**Status:** ✅ Complete — data collected via direct API fetches

---

## 🔧 Run Notes

All sources fetched directly via public APIs or RSS. Infrastructure status:

- **Remotive API** ✅ — 20 jobs returned (down from 23 on May 8 — same core listings, Chooose Fullstack role aged out)
- **We Work Remotely RSS** ✅ — 25 items; new entries from Apr 13–14 now in feed
- **Ashby (Linear)** ✅ — 23 total jobs (engineering stable at 5; new GTM roles visible)
- **Ashby (PostHog)** ✅ — 16 jobs (stable, no new additions since May 8)
- **Ashby (Resend)** ✅ — 6 total jobs (3 engineering tracked; 3 non-engineering also visible now)
- **Ashby (Clerk)** ✅ — 1 job (unchanged)
- **Greenhouse (Monzo)** ✅ — 67 total (up from 65); new roles are non-engineering (Benefits Specialist, Finance Forecasting Modeller, Staff User Researcher)
- **Greenhouse (Intercom)** ✅ — 171 total; new: Principal Engineer, Fin AI Agent (London + Dublin, first published May 7 — was captured in May 8 run)
- **Greenhouse (Vercel)** ✅ — 82 total (stable; no new engineering roles since May 8)
- **Greenhouse (Brex)** ✅ — 223 total; 🆕 Senior Engineering Manager, Acquisition + Senior Software Engineer Frontend + Software Engineer II Backend newly visible
- **Greenhouse (Duolingo)** ✅ — 83 total (stable, no new engineering roles)
- **Greenhouse (Cleo)** ✅ — 5 total; Account Executive Net New added (non-engineering)
- **Jobicy** 🔴 — Bot-blocked again (403) — intermittent, was accessible on May 8 only
- **Lever** ⚠️ — All monitored slugs still 404 (unchanged)

Production ingestion blocker remains: `matchpilot-production-a08d.up.railway.app` is not on the Cowork egress allowlist. Jobs below are ready for manual ingest.

---

## 📦 Source 1: Remotive
*URL: https://remotive.com/api/remote-jobs?category=software-dev&limit=100*  
*20 jobs this run (down from 23 on May 8)*

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
| iOS Developer | nooro | USA | ✅ |

**Notable:** Feed is stable vs May 8 — same core roles, slightly trimmed. A.Team and Lemon.io remain evergreen. Chooose Fullstack Developer (US - ET) has aged out. No new software-dev entries this run.

---

## 📦 Source 2: We Work Remotely
*URL: https://weworkremotely.com/categories/remote-programming-jobs.rss*  
*25 items this run*

| Title | Company | Posted | Link |
|-------|---------|--------|------|
| Lead Full Stack Developer (UI/UX) | Hitachi Vantara Corporation | 2026-04-14 | [Link](https://weworkremotely.com/remote-jobs/hitachi-vantara-corporation-lead-full-stack-developer-ui-ux) |
| Director, Product Management (AI Agent Platform) | Nextiva | 2026-04-14 | [Link](https://weworkremotely.com/remote-jobs/nextiva-director-product-management-ai-agent-platform) |
| Product Design Manager, Engagement | Discord | 2026-04-11 | [Link](https://weworkremotely.com/remote-jobs/discord-product-design-manager-engagement) |
| Head of Experience Design | Jimdo | 2026-04-10 | [Link](https://weworkremotely.com/remote-jobs/jimdo-head-of-experience-design) |
| System Design / Solution Architect | SSC HR Solutions | 2026-04-10 | [Link](https://weworkremotely.com/remote-jobs/ssc-hr-solutions-system-design-solution-architect) |
| Senior AI Engineer / Data Annotator | Lemon.io | 2026-04-10 | [Link](https://weworkremotely.com/remote-jobs/lemon-io-senior-ai-engineer-data-annotator) |
| Senior Frontend Engineer - Product | Feedzai | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/feedzai-senior-frontend-engineer-product) |
| Backend Engineer (TypeScript/Node.js) — DevOps Mindset | Glückliche Gäste | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/gluckliche-gaste-backend-engineer-typescript-node-js-devops-mindset-m-w-d) |
| Senior Full Stack Developer (Go/React) | Mmdsmart Ltd | 2026-04-09 | [Link](https://weworkremotely.com/remote-jobs/mmdsmart-ltd-senior-full-stack-developer-go-react) |
| Software Engineer, Business Experience | CodeSignal | 2025-11-12 | [Link](https://weworkremotely.com/remote-jobs/codesignal-software-engineer-business-experience-1) |
| Frontend Engineer | Mobena | 2025-05-16 | [Link](https://weworkremotely.com/remote-jobs/mobena-frontend-engineer) |

**🆕 New this run vs May 8:** Hitachi Vantara Lead Full Stack Developer (UI/UX) — remote engineering role at an enterprise IT company; Nextiva Director of Product Management (AI Agent Platform) — senior PM/platform role in the AI comms space. Brightwheel, Titan AI, and Philo roles from May 8 have aged out of the RSS feed.

---

## 📦 Source 3: Ashby (Monitored Companies)

### Linear — 23 total jobs (5 engineering, stable)
*Engineering roles unchanged vs May 8. New GTM/Ops additions this run.*

| Title | Dept | Location | Type | Link |
|-------|------|----------|------|------|
| Senior / Staff Fullstack Engineer | Product | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) |
| Senior / Staff Fullstack Engineer | Product | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff) |
| Senior / Staff Product Engineer | Product | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/12f8f208-0b9c-4569-bb3d-41c8a197029e) |
| Senior / Staff Product Engineer | Product | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/069c4628-88d7-4e4d-b393-c996fc7f3076) |
| Senior / Staff Product Engineer, AI | Product | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5) |
| Product Manager | Product | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/b7669c4b-eeca-421d-ba9a-d90203f6fcb2) |
| Product Manager | Product | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/86abcce0-04b2-405c-9a8e-e0ca84813914) |
| Developer Marketing | GTM | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/1d652292-04d9-405c-8101-578efd020e94) |
| Developer Marketing | GTM | Europe | Remote | [Link](https://jobs.ashbyhq.com/linear/62a4524c-75da-499e-b150-7f68ce9f2da3) |
| Account Executive, APAC | GTM | Australia | Remote | [Link](https://jobs.ashbyhq.com/linear/82778dbf-711e-4d23-9d49-4a60db76737a) |
| Manager, Growth Sales | GTM | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/5e5f6557-7ac6-4b9f-bdb0-89354e77c644) |
| Accounting Lead | Operations | North America | Remote | [Link](https://jobs.ashbyhq.com/linear/c7151df1-8c03-4c3b-b46c-becf51b61bcc) |
| Account Executive, Growth (EU) | GTM | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/59fa48ec-6685-4ab2-a388-6203423811d2) |
| Account Executive, Enterprise (EU) | GTM | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/3adaa1f5-2cf1-480d-8daf-92345ec08395) |
| Solutions Engineer, Europe | GTM | London | Hybrid | [Link](https://jobs.ashbyhq.com/linear/d37b3d76-3080-47f9-8a19-60505573112c) |

**🆕 New GTM roles vs May 8:** Developer Marketing (EU + NA), Account Executive APAC (Australia), Manager Growth Sales, Accounting Lead. Engineering count stable at 5 (same roles as May 8). Linear appears to be continuing its GTM/Ops scaling push with APAC expansion now visible.

### Clerk — 1 job (unchanged)
| Title | Location | Type | Link |
|-------|----------|------|------|
| Senior Technical Account Manager | Remote / SF | Remote | [Link](https://jobs.ashbyhq.com/Clerk/cc13322d-892c-4fec-bf9f-07dc605343b3) |

### PostHog — 16 jobs (stable, no new roles since May 8)

| Title | Dept | Location | Type | Link |
|-------|------|----------|------|------|
| Technical Ex-Founder | Engineering | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/3a7e914b-a993-46e6-9029-6a0f54652497) |
| Backend Engineer — Ingestion | Engineering | Remote (EMEA) | Remote | [Link](https://jobs.ashbyhq.com/posthog/3f190a45-7810-47f9-b77d-169b806ea266) |
| ClickHouse Operations Engineer | Engineering | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/43dbf072-0fc1-48c9-8c1e-7416db7d4a14) |
| Product Engineer | Engineering | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/20ab9628-20ff-4ae3-bd6a-46ae7e9dc6b8) |
| Forward Deployed Engineer | Sales & CS | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/28781aeb-eca4-4713-9a5f-a95b95d5d120) |
| AI Research Engineer | Engineering | Hybrid (UK) | Hybrid | [Link](https://jobs.ashbyhq.com/posthog/8dc3f33a-b930-4c54-b4c4-3e6bd2ff28d3) |
| Site Reliability Engineer | Engineering | Remote | Remote | [Link](https://jobs.ashbyhq.com/posthog/1464036f-94d5-4dbd-aef8-fe99246a26d4) |
| Design Engineer | Engineering | Remote (EMEA) | Remote | [Link](https://jobs.ashbyhq.com/posthog/f90953aa-c0ce-4e87-8a3b-e9163eea52b9) |

**Notable:** PostHog board is stable at 16 jobs, all roles from May 8 persist. "Technical Ex-Founder" (published Jan 14) is an unusual catch-all engineering role for ex-founders with product + engineering depth — worth noting for the right profile. Engineering count remains strong at 7 IC roles.

### Resend — 6 total jobs visible (3 engineering)
*Engineering jobs tracked: Developer Experience Engineer, Backend Engineer Core Sending, Customer Success Engineer — all unchanged*

| Title | Location | Type | Link |
|-------|----------|------|------|
| Backend Engineer, Core Sending | Americas / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/a95832a8-a2ab-4a63-8303-9989f1fc47d6) |
| Developer Experience Engineer | USA / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/06bd9cb2-d189-41b6-baf7-42bd5da9610f) |
| Customer Success Engineer | Europe / Remote | Remote | [Link](https://jobs.ashbyhq.com/resend/f0af27d1-eddd-42b9-a962-f34dc350c390) |

**Note:** Resend board now fully returning 6 roles. Account Executive, Ops Generalist, and Business Development & Partnerships are also active but non-engineering. All three engineering-relevant roles are stable from May 8.

---

## 📦 Source 4: Greenhouse (Monitored Companies)

### Monzo — 67 total jobs (up from 65 on May 8)
*Engineering roles stable. New roles are all non-engineering.*

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
| Senior Engineering Manager | Cardiff, London or Remote (UK) | [Link](https://job-boards.greenhouse.io/monzo/jobs/6394676) |
| Senior Analytics Engineering Manager | Barcelona | [Link](https://job-boards.greenhouse.io/monzo/jobs/7775035) |

**🆕 New non-engineering roles added May 8:** Benefits Specialist (×2, Cardiff/London Remote), Finance Forecasting Modeller (UK), Staff User Researcher Wealth (Cardiff/London Remote), People Governance & Accountability Senior Manager (Cardiff/London Remote). Engineering board unchanged.

### Intercom — 171 total jobs (~102 engineering-relevant)
*🆕 New since May 8: Principal Engineer, Fin AI Agent (London + Dublin, first published May 7)*

| Title | Location | Link |
|-------|----------|------|
| Principal Engineer, Fin AI Agent | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7725840) |
| Principal Engineer, Fin AI Agent | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7742203) |
| Principal Engineer, Fin AI Agent | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7383950) |
| Senior Engineering Manager, Fin AI Agent | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825844) |
| Senior Engineering Manager, Fin AI Agent | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825825) |
| Senior Engineering Manager, Fin AI Agent | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7825849) |
| AI Infrastructure Engineer | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824137) |
| AI Infrastructure Engineer | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7820671) |
| AI Infrastructure Engineer | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7824142) |
| Engineering Manager, AI Models Infrastructure | London/Dublin/Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7784684) |
| Staff Product Engineer, AI | Dublin/London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7383950) |
| Staff Product Engineer, AI | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7393922) |
| Principal Engineer, Web Platform – Team Web | London | [Link](https://job-boards.greenhouse.io/intercom/jobs/7515665) |
| Principal Engineer, Web Platform – Team Web | Dublin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7515664) |
| Senior Director, Engineering | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7773191) |
| Software Engineer | Berlin | [Link](https://job-boards.greenhouse.io/intercom/jobs/7371989) |

**Notable:** Intercom's AI hiring continues to deepen. Principal Engineer, Fin AI Agent now live in both London and Dublin (first published May 7). Web Platform Principal Engineer also active in both cities. Senior Director Engineering (Berlin) is a significant leadership hire. All three Fin AI Agent roles (IC + EM tiers) remain open across all three cities.

### Vercel — 82 total jobs (38 engineering, stable since May 8)
*No new engineering roles first published since May 5.*

| Title | Location | Link |
|-------|----------|------|
| Forward Deployed Engineer, v0 | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5872425004) |
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
| Software Engineer, Growth | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5613601004) |
| Software Engineer, Lua | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5661583004) |
| Software Engineer, Workflows | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5798416004) |
| Anti-Abuse Automation Engineer | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5843010004) |
| Senior Software Engineer, Trust & Safety | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5788954004) |
| Design Engineer | Remote - US | [Link](https://job-boards.greenhouse.io/vercel/jobs/5709080004) |
| Mobile Engineer | Hybrid - NYC | [Link](https://job-boards.greenhouse.io/vercel/jobs/5719796004) |
| Forward-Deployed Engineer (EU) | London / Berlin (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5778418004) |
| Developer Success Engineer | Remote - UK / Germany | [Link](https://job-boards.greenhouse.io/vercel/jobs/5530586004) |
| Sr. Engineering Manager, Platform | SF / NYC (Hybrid) | [Link](https://job-boards.greenhouse.io/vercel/jobs/5461002004) |

**Notable:** All engineering roles from May 8 persist. No new openings. Vercel's board is stable — AI SDK, AI Gateway, and Agent roles remain open, suggesting these are hard-to-fill positions.

### Brex — 223 total jobs (62 engineering-relevant)
*🆕 New engineering roles since May 8 run:*

| Title | Location | Link |
|-------|----------|------|
| **🆕** Senior Engineering Manager, Acquisition | SF / NY / Seattle / Vancouver | [Link](https://www.brex.com/careers/8536914002) |
| **🆕** Senior Software Engineer, Frontend | Vancouver | [Link](https://www.brex.com/careers/8536763002) |
| **🆕** Software Engineer II, Backend | SF / NY | [Link](https://www.brex.com/careers/8459783002) |
| Senior Software Engineer, Frontend | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8501052002) |
| Senior Software Engineer, Full Stack | SF / Seattle / Vancouver / NYC / São Paulo | [Link](https://www.brex.com/careers/8472635002) |
| Senior Software Engineer, AI - Simulation | SF / Seattle | [Link](https://www.brex.com/careers/8442494002) |
| Senior Software Engineer, Product | SF / Seattle / NYC | [Link](https://www.brex.com/careers/8461469002) |
| Software Engineer, Forward Deployed Agent Builder | Seattle / São Paulo | [Link](https://www.brex.com/careers/8523205002) |
| Application Security Engineer | Remote | [Link](https://www.brex.com/careers/8534944002) |
| Engineering Manager, AI — Brex Assistant | SF / Seattle | [Link](https://www.brex.com/careers/8393583002) |
| Engineering Manager, Cloud Infrastructure | SF / NYC / Seattle | [Link](https://www.brex.com/careers/8534633002) |
| Engineering Manager, Onboarding | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8461600002) |
| Engineering Manager, GTM Engineering | SF / NYC / Seattle / Vancouver | [Link](https://www.brex.com/careers/8339037002) |

**🆕 New since May 8:** Senior Engineering Manager, Acquisition (first published May 5 — Brex scaling acquisition engineering leadership), Senior Software Engineer Frontend Vancouver (new location variant), Software Engineer II Backend (mid-level back-end openings). Brex is now also showing Engineering Manager, GTM Engineering which was not visible in the May 8 report.

### Duolingo — 83 total jobs (19 engineering, stable)
*No new engineering roles since May 8.*

| Title | Location | Link |
|-------|----------|------|
| Staff AI Research Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8525406002) |
| Senior Engineering Manager, Monetization | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8534630002) |
| Director of Data Science & Analytics, User Growth | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8508337002) |
| Senior Software Engineer, Backend | Seattle, WA | [Link](https://careers.duolingo.com/jobs/8457170002) |
| Senior Software Engineer, Chess | New York, NY | [Link](https://careers.duolingo.com/jobs/8445379002) |
| Senior Android Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8215862002) |
| Senior iOS Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8393272002) |
| Senior Platform Engineer | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8449936002) |
| Platform Engineer II | Pittsburgh, PA | [Link](https://careers.duolingo.com/jobs/8449895002) |
| Engineering Manager, Notifications | Pittsburgh / NYC | [Link](https://careers.duolingo.com/jobs/8468545002) |

**Notable:** Duolingo engineering board is unchanged from May 8. Mostly Pittsburgh-based (in-person required) with limited remote options. Staff AI Research Engineer remains the standout opening.

### Cleo — 5 total jobs (stable engineering count)
| Title | Location | Link |
|-------|----------|------|
| AI Product Manager | Remote - USA | [Link](https://job-boards.greenhouse.io/cleo/jobs/4664509005) |
| Cloud Security Lead | Remote US | [Link](https://job-boards.greenhouse.io/cleo/jobs/4674041005) |
| Solutions Architect | Remote - USA | [Link](https://job-boards.greenhouse.io/cleo/jobs/4666306005) |

**Note:** Cleo added Account Executive, Net New (first published May 5) — non-engineering, not tracked. Engineering/technical roles stable.

---

## 📦 Source 5: Jobicy
*URL: https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineer*
*🔴 Bot-blocked (403) — intermittent; was accessible on May 8 only*

**Status:** Jobicy has re-activated bot protection. This is the second time it's bot-blocked in three runs (accessible May 8, blocked May 6 and May 9). Consider rotating user-agent headers or adding a retry-with-delay strategy.

---

## 🆕 Changes vs May 8 Run

| Change | Detail |
|--------|--------|
| 🟢 Brex: Senior Engineering Manager, Acquisition | New EM role first published May 5 — Brex scaling acquisition engineering leadership across SF/NY/Seattle/Vancouver |
| 🟢 Brex: Senior Software Engineer, Frontend | New Vancouver variant (first published May 5) |
| 🟢 Brex: Software Engineer II, Backend | Two new mid-level backend roles (SF, NY, first published May 5) |
| 🟢 Brex: Engineering Manager, GTM Engineering | Newly visible in feed across 4 cities |
| 🟢 Intercom: Principal Engineer, Fin AI Agent (London + Dublin) | First published May 7 — captured in this run; deepens Fin AI Agent leadership pipeline |
| 🟢 WWR: Hitachi Vantara Lead Full Stack Developer | New in RSS feed; enterprise full-stack remote role |
| 🟢 WWR: Nextiva Director, Product Management (AI Agent Platform) | New in RSS; senior PM for AI communications platform |
| 🟢 Linear: New GTM/Ops roles | Developer Marketing EU+NA, AE APAC, Manager Growth Sales, Accounting Lead — engineering stable |
| 🟡 Remotive: 20 jobs (down from 23) | Chooose Fullstack Developer aged out; feed slightly contracted |
| 🟡 WWR: Brightwheel, Titan AI, Philo roles removed | Aged out of RSS feed |
| 🔴 Jobicy: Bot-blocked again | 403 today — intermittent protection is proving unreliable for daily scraping |

---

## 🏆 Top Picks (High Signal Roles)

These roles best match a TypeScript / React / Node.js fullstack engineering profile:

1. **PostHog — Product Engineer** · Ashby · Remote — PostHog's core IC product engineering role. Fully remote, open-source analytics company with exceptional developer culture. [Apply](https://jobs.ashbyhq.com/posthog/20ab9628-20ff-4ae3-bd6a-46ae7e9dc6b8)

2. **PostHog — Backend Engineer, Ingestion** · Ashby · Remote (EMEA) — Data pipeline engineering at scale; handles billions of events. Strong TypeScript/Python stack. [Apply](https://jobs.ashbyhq.com/posthog/3f190a45-7810-47f9-b77d-169b806ea266)

3. **Linear — Senior/Staff Product Engineer, AI** · Ashby · Remote, North America — Highest-signal role on the watchlist; AI product work at a company known for engineering excellence. [Apply](https://jobs.ashbyhq.com/linear/b4a7764e-c680-4bdf-9956-dc78f2ca94d5)

4. **Linear — Senior/Staff Fullstack Engineer** · Ashby · Remote, EU or North America — Evergreen high-bar role with both EU and NA variants open. [Apply (NA)](https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32) · [Apply (EU)](https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff)

5. **Vercel — Software Engineer, AI SDK** · Greenhouse · SF/NYC Hybrid — Core AI tooling work at the platform behind Next.js and v0. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5474915004)

6. **Vercel — Software Engineer, Agent** · Greenhouse · SF Hybrid — Building Vercel's agentic product layer; rare agentic infra role at a top-tier platform company. [Apply](https://job-boards.greenhouse.io/vercel/jobs/5704320004)

7. **Intercom — Staff Product Engineer, AI** · Greenhouse · Dublin/London/Berlin — Staff-level AI product engineering at scaled SaaS; Fin AI Agent context. [Apply](https://job-boards.greenhouse.io/intercom/jobs/7393950)

8. **Resend — Backend Engineer, Core Sending** · Ashby · Americas Remote — Small team, high-impact infrastructure. TypeScript + Golang, async pipeline at scale. Comp: $150K–$170K USD. [Apply](https://jobs.ashbyhq.com/resend/a95832a8-a2ab-4a63-8303-9989f1fc47d6)

9. **PostHog — Design Engineer** · Ashby · Remote (EMEA) — Product + design engineering hybrid; rare opening at a company known for quality UI. [Apply](https://jobs.ashbyhq.com/posthog/f90953aa-c0ce-4e87-8a3b-e9163eea52b9)

10. **Monzo — Senior Staff Backend Engineer** · Greenhouse · Remote (UK) — Staff+ level at a top-tier UK fintech with strong engineering culture. [Apply](https://job-boards.greenhouse.io/monzo/jobs/6036797)

11. **Brex — Software Engineer, Forward Deployed Agent Builder** · Greenhouse · Seattle / São Paulo — Agentic product work ("Brex Assistant") at a major fintech. [Apply](https://www.brex.com/careers/8523205002)

12. **Glückliche Gäste — Backend Engineer (TypeScript/Node.js)** · WWR · Remote — TypeScript/Node fullstack with DevOps mindset; EU-based company, still in feed. [Apply](https://weworkremotely.com/remote-jobs/gluckliche-gaste-backend-engineer-typescript-node-js-devops-mindset-m-w-d)

---

## ⚠️ Source Health Issues (Action Required)

| Priority | Issue | Action |
|----------|-------|--------|
| 🔴 High | Lever: all monitored slugs returning 404 | Full Lever watchlist audit needed — companies have migrated ATS |
| 🔴 High | Jobicy: intermittent bot-blocking (2/3 recent runs) | Add retry logic with user-agent rotation or use Firecrawl for this source |
| 🟡 Medium | Greenhouse: 12 of 18 companies returning 404 (Wise, Revolut, Notion, Supabase, etc.) | Find updated ATS URLs for migrated companies |
| 🟡 Medium | Production ingest URL blocked by Cowork egress filter | Whitelist `matchpilot-production-a08d.up.railway.app` in Settings → Capabilities |
| 🟢 Low | Remotive: 20 jobs vs prior 100+ on early runs | Category filter or API pagination may have changed; worth testing without category param |
| 🟢 Low | Reed/Adzuna keys missing | Add `REED_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_API_KEY` to `.env.local` |

---

*Report generated by MatchPilot scheduled task · 2026-05-09*
