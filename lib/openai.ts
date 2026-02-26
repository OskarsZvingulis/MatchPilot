import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const client = new OpenAI({ apiKey });

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

type RoleCategory = (typeof ROLE_CATEGORIES)[number];
type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];
type RemoteFeasibility = (typeof REMOTE_FEASIBILITIES)[number];

// ─── Return types ─────────────────────────────────────────────────────────────

export interface JobScore {
  role_category: RoleCategory;
  score: number;
  experience_band: ExperienceBand;
  remote_feasibility: RemoteFeasibility;
  reasons: string[];
  red_flags: string[];
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

const SCORE_SYSTEM = `You are a job classification and scoring engine. Return ONLY valid JSON. No explanation. No markdown. No commentary.`;

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

REQUIRED JSON STRUCTURE:
{
  "role_category": "",
  "score": 0,
  "experience_band": "0-2|3-5|5+|unknown",
  "remote_feasibility": "good|maybe|no",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "red_flags": ["flag 1"]
}

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

export async function scoreJob(description: string): Promise<JobScore> {
  const response = await client.chat.completions.create({
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

  if (typeof data.role_category !== 'string' || !(ROLE_CATEGORIES as readonly string[]).includes(data.role_category)) {
    throw new Error(
      `scoreJob: invalid "role_category" "${data.role_category}" — must be one of: ${ROLE_CATEGORIES.join(', ')}`,
    );
  }
  if (typeof data.score !== 'number') {
    throw new Error('scoreJob: missing or invalid "score" (expected number 0–100)');
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

  return {
    role_category: data.role_category as RoleCategory,
    score: data.score,
    experience_band: data.experience_band as ExperienceBand,
    remote_feasibility: data.remote_feasibility as RemoteFeasibility,
    reasons: data.reasons,
    red_flags: data.red_flags,
  };
}

// ─── generateAssets ───────────────────────────────────────────────────────────

export async function generateAssets(
  title: string,
  company: string,
  description: string,
): Promise<JobAssets> {
  const response = await client.chat.completions.create({
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
