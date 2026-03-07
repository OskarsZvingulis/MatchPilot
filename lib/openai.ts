import OpenAI from 'openai';

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

// ─── Allowed enum values ───────────────────────────────────────────────────────

const ROLE_CATEGORIES = [
  'product_engineer',
  'technical_support',
  'implementation_engineer',
  'qa_automation',
  'other',
  'reject',
] as const;

const EXPERIENCE_BANDS = ['0-2', '3-5', '5+', 'unknown'] as const;

const REMOTE_FEASIBILITIES = ['good', 'maybe', 'no'] as const;

const VISA_RESTRICTIONS = ['none', 'uk_only', 'us_only', 'eu_only', 'unknown'] as const;

const SALARY_CURRENCIES = ['GBP', 'EUR', 'USD', 'unknown'] as const;

const TECH_MISMATCH_LEVELS = ['none', 'some', 'major'] as const;
const TECH_MISMATCH_LEVEL_SET = new Set<string>(TECH_MISMATCH_LEVELS);

type RoleCategory = (typeof ROLE_CATEGORIES)[number];
type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];
type RemoteFeasibility = (typeof REMOTE_FEASIBILITIES)[number];
type VisaRestriction = (typeof VISA_RESTRICTIONS)[number];
type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];
type TechMismatchLevel = (typeof TECH_MISMATCH_LEVELS)[number];

// ─── Return types ─────────────────────────────────────────────────────────────

export interface JobScore {
  role_category: RoleCategory;
  score: number;
  experience_band: ExperienceBand;
  remote_feasibility: RemoteFeasibility;
  reasons: string[];
  red_flags: string[];
  onsite_required: boolean;
  visa_restriction: VisaRestriction;
  salary_min_gbp: number | null;
  salary_max_gbp: number | null;
  salary_currency: SalaryCurrency;
  tech_mismatch: boolean;
  tech_mismatch_level: TechMismatchLevel;
}

export interface CvEmphasis {
  lead_project: string;
  highlight_skills: string[];
  talking_points: string[];
}

export interface JobAssets {
  intro_paragraph: string;
  cover_letter: string;
  cv_emphasis: CvEmphasis;
}

// ─── Scoring prompts ──────────────────────────────────────────────────────────

const SCORE_SYSTEM = `You are a job classification and scoring engine. Return ONLY valid JSON. No explanation. No markdown. No commentary. Fill every key in the required structure. Salary fields must be numbers or null. Set onsite_required to true only if the posting explicitly states onsite-only, 5 days in office, or no remote option. Set visa_restriction based on explicit language about right to work, citizenship requirements, or no sponsorship. For tech_mismatch_level: "none" means the stack aligns with the candidate's core skills (TypeScript, React, APIs, SaaS); "some" means partial match with notable gaps the candidate could ramp on; "major" means the core required stack is outside the candidate's experience (e.g. Django, Azure, DBA-heavy, Java-only, embedded, mobile-native). If unsure, choose "some". Set tech_mismatch to true only when tech_mismatch_level is "major".`;

function buildScoreUserMessage(description: string): string {
  return `CANDIDATE PROFILE:
Candidate: Entry-level SaaS engineer. Strong in API integrations and cross-system debugging. Production experience with SaaS onboarding platform and AI tool. 15 years UK technical background. Open to remote UK/US/global. Contract acceptable.

TARGET ROLES (in priority order):
- product_engineer
- technical_support
- implementation_engineer
- qa_automation
- other
- reject

SCORING RULES:
- Prioritize: API/integration mentions, SaaS platform context, remote-first, cross-functional communication
- Penalize: onsite-only, US-citizens-only, 5+ years mandatory, graduate programs
- Fintech weighting is NOT special unless role is integration/API heavy

Experience band classification rules:
- Use "5+" ONLY if the posting explicitly contains: "5+ years", "Senior", "Staff", "Lead", or "Principal"
- Use "0-2" ONLY if explicitly states graduate, junior, entry-level, or 0-2 years
- Use "3-5" if explicitly states 3-5 years
- If no explicit seniority stated, default to "3-5"
- Do NOT infer seniority from tone, ownership, responsibility, or startup language

Scoring scale guidance:
- 90–100: Exceptional fit, highly aligned with candidate strengths
- 75–89: Strong fit, good alignment with APIs/SaaS/remote
- 60–74: Moderate fit, some alignment but not ideal
- 40–59: Weak fit
- 0–39: Poor fit or clear mismatch

Most reasonable SaaS/API roles with remote options should score between 70–85.
Do not default to very low numbers unless strong mismatch exists.

REQUIRED JSON STRUCTURE:
{
  "role_category": "",
  "score": 0,
  "experience_band": "0-2|3-5|5+|unknown",
  "remote_feasibility": "good|maybe|no",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "red_flags": ["flag 1"],
  "onsite_required": false,
  "visa_restriction": "none|uk_only|us_only|eu_only|unknown",
  "salary_min_gbp": null,
  "salary_max_gbp": null,
  "salary_currency": "GBP|EUR|USD|unknown",
  "tech_mismatch_level": "none|some|major",
  "tech_mismatch": false
}

tech_mismatch_level definitions:
- "none": stack aligns with candidate's core skills (TypeScript, React, REST APIs, SaaS tooling)
- "some": partial match — notable gaps but candidate can ramp (e.g. Python-adjacent, AWS basics needed)
- "major": core required stack is outside candidate's experience (Django/Flask, Azure, Java, mobile-native, DBA-heavy, embedded)
If unsure, output "some". Never output any value other than none/some/major.
tech_mismatch must be true if and only if tech_mismatch_level is "major".

JOB DESCRIPTION:
${description}`;
}

// ─── Asset generation prompts ─────────────────────────────────────────────────

const ASSETS_SYSTEM = `You are a strategic job application writer. Generate tailored, honest application materials. No fluff. No generic phrases like "I am excited to apply". Be specific and direct.`;

function buildAssetsUserMessage(title: string, company: string, description: string): string {
  return `Candidate profile:
- 15 years UK technical experience (diagnostics/systems)
- Production SaaS: built API-driven onboarding platform (TypeScript, Supabase, REST APIs)
- Built AIDQA: AI-assisted visual regression SaaS tool
- Strengths: API integrations, end-to-end debugging, business-to-technical translation
- Fluent English, UK work background, based in Latvia, targeting remote roles
- Open to contract

Job title: ${title}
Company: ${company}
Job description:
"""
${description}
"""

Return JSON:
{
  "intro_paragraph": "2-3 sentence strategic opener tailored to this specific role",
  "cover_letter": "3-4 paragraph cover letter, specific to this job and company",
  "cv_emphasis": {
    "lead_project": "onboarding_platform or aidqa",
    "highlight_skills": ["skill1", "skill2"],
    "talking_points": ["point1", "point2", "point3"]
  }
}`;
}

// ─── scoreJob ─────────────────────────────────────────────────────────────────

export async function scoreJob(description: string, job?: { remote?: unknown }): Promise<JobScore> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SCORE_SYSTEM },
      { role: 'user', content: buildScoreUserMessage(description) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('scoreJob: OpenAI returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`scoreJob: Failed to parse JSON — ${content}`);
  }

  const data = parsed as Record<string, unknown>;

  // ── Normalize remote_feasibility before validation ──────────────────────────
  const allowed = ['good', 'maybe', 'no'];
  let rf: string = (data.remote_feasibility as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!allowed.includes(rf)) {
    rf = job?.remote === true ? 'maybe' : 'no';
  }
  data.remote_feasibility = rf;

  // ── Normalize tech_mismatch_level before validation ─────────────────────────
  let tml = (data.tech_mismatch_level as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!TECH_MISMATCH_LEVEL_SET.has(tml)) tml = 'some';
  data.tech_mismatch_level = tml as TechMismatchLevel;
  data.tech_mismatch = tml === 'major';
  // ────────────────────────────────────────────────────────────────────────────

  // ── Region detection ───────────────────────────────────────────────────────
  const descriptionLower = description.toLowerCase();

  const isUS =
    data.visa_restriction === 'us_only' ||
    descriptionLower.includes('united states') ||
    descriptionLower.includes('usa') ||
    descriptionLower.includes('us only') ||
    descriptionLower.includes('u.s.');

  // ── US onsite cap (UK onsite allowed to score freely) ──────────────────────
  if (data.onsite_required === true && isUS) {
    data.score = Math.min(data.score as number, 40);
  }
  // ───────────────────────────────────────────────────────────────────────────

  if (typeof data.role_category !== 'string' || !(ROLE_CATEGORIES as readonly string[]).includes(data.role_category)) {
    throw new Error(
      `scoreJob: invalid "role_category" "${data.role_category}" — must be one of: ${ROLE_CATEGORIES.join(', ')}`,
    );
  }
  if (
    typeof data.score !== 'number' ||
    !Number.isFinite(data.score) ||
    data.score < 0 ||
    data.score > 100
  ) {
    throw new Error('scoreJob: invalid "score" (expected number 0–100)');
  }
  if (typeof data.experience_band !== 'string' || !(EXPERIENCE_BANDS as readonly string[]).includes(data.experience_band)) {
    throw new Error(
      `scoreJob: invalid "experience_band" "${data.experience_band}" — must be one of: ${EXPERIENCE_BANDS.join(', ')}`,
    );
  }
  if (typeof data.remote_feasibility !== 'string' || !(REMOTE_FEASIBILITIES as readonly string[]).includes(data.remote_feasibility)) {
    throw new Error(
      `scoreJob: invalid "remote_feasibility" "${data.remote_feasibility}" — must be one of: ${REMOTE_FEASIBILITIES.join(', ')}`,
    );
  }
  if (!Array.isArray(data.reasons) || !data.reasons.every((r) => typeof r === 'string')) {
    throw new Error('scoreJob: missing or invalid "reasons" (expected string[])');
  }
  if (!Array.isArray(data.red_flags) || !data.red_flags.every((f) => typeof f === 'string')) {
    throw new Error('scoreJob: missing or invalid "red_flags" (expected string[])');
  }
  if (typeof data.onsite_required !== 'boolean') {
    throw new Error('scoreJob: missing or invalid "onsite_required" (expected boolean)');
  }
  if (typeof data.visa_restriction !== 'string' || !(VISA_RESTRICTIONS as readonly string[]).includes(data.visa_restriction)) {
    throw new Error(
      `scoreJob: invalid "visa_restriction" "${data.visa_restriction}" — must be one of: ${VISA_RESTRICTIONS.join(', ')}`,
    );
  }
  if (data.salary_min_gbp !== null && typeof data.salary_min_gbp !== 'number') {
    throw new Error('scoreJob: invalid "salary_min_gbp" (expected number or null)');
  }
  if (data.salary_max_gbp !== null && typeof data.salary_max_gbp !== 'number') {
    throw new Error('scoreJob: invalid "salary_max_gbp" (expected number or null)');
  }
  if (typeof data.salary_currency !== 'string' || !(SALARY_CURRENCIES as readonly string[]).includes(data.salary_currency)) {
    throw new Error(
      `scoreJob: invalid "salary_currency" "${data.salary_currency}" — must be one of: ${SALARY_CURRENCIES.join(', ')}`,
    );
  }
  // tech_mismatch and tech_mismatch_level are both normalized above — no further validation needed

  return {
    role_category: data.role_category as RoleCategory,
    score: data.score,
    experience_band: data.experience_band as ExperienceBand,
    remote_feasibility: data.remote_feasibility as RemoteFeasibility,
    reasons: data.reasons,
    red_flags: data.red_flags,
    onsite_required: data.onsite_required,
    visa_restriction: data.visa_restriction as VisaRestriction,
    salary_min_gbp: data.salary_min_gbp as number | null,
    salary_max_gbp: data.salary_max_gbp as number | null,
    salary_currency: data.salary_currency as SalaryCurrency,
    tech_mismatch: data.tech_mismatch as boolean,
    tech_mismatch_level: data.tech_mismatch_level as TechMismatchLevel,
  };
}

// ─── generateAssets ───────────────────────────────────────────────────────────

export async function generateAssets(
  title: string,
  company: string,
  description: string,
): Promise<JobAssets> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ASSETS_SYSTEM },
      { role: 'user', content: buildAssetsUserMessage(title, company, description) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('generateAssets: OpenAI returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`generateAssets: Failed to parse JSON — ${content}`);
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.intro_paragraph !== 'string') {
    throw new Error('generateAssets: missing or invalid "intro_paragraph" (expected string)');
  }
  if (typeof data.cover_letter !== 'string') {
    throw new Error('generateAssets: missing or invalid "cover_letter" (expected string)');
  }

  const cv = data.cv_emphasis as Record<string, unknown> | null | undefined;
  if (!cv || typeof cv !== 'object') {
    throw new Error('generateAssets: missing or invalid "cv_emphasis" (expected object)');
  }
  if (typeof cv.lead_project !== 'string') {
    throw new Error('generateAssets: missing or invalid "cv_emphasis.lead_project" (expected string)');
  }
  if (!Array.isArray(cv.highlight_skills) || !cv.highlight_skills.every((s) => typeof s === 'string')) {
    throw new Error('generateAssets: missing or invalid "cv_emphasis.highlight_skills" (expected string[])');
  }
  if (!Array.isArray(cv.talking_points) || !cv.talking_points.every((t) => typeof t === 'string')) {
    throw new Error('generateAssets: missing or invalid "cv_emphasis.talking_points" (expected string[])');
  }

  return {
    intro_paragraph: data.intro_paragraph,
    cover_letter: data.cover_letter,
    cv_emphasis: {
      lead_project: cv.lead_project,
      highlight_skills: cv.highlight_skills,
      talking_points: cv.talking_points,
    },
  };
}
