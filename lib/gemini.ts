import { GoogleGenAI } from '@google/genai';
import { CANDIDATE_PROFILE } from '@/lib/candidateProfile';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
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

const SALARY_CURRENCIES = ['GBP', 'EUR', 'USD', 'CAD', 'AUD', 'unknown'] as const;

const TECH_MISMATCH_LEVELS = ['none', 'some', 'major'] as const;
const TECH_MISMATCH_LEVEL_SET = new Set<string>(TECH_MISMATCH_LEVELS);

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead_plus', 'unknown'] as const;
const SENIORITY_LEVEL_SET = new Set<string>(SENIORITY_LEVELS);

const INFRA_DEPTHS = ['none', 'light', 'heavy'] as const;
const INFRA_DEPTH_SET = new Set<string>(INFRA_DEPTHS);

type RoleCategory = (typeof ROLE_CATEGORIES)[number];
type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];
type RemoteFeasibility = (typeof REMOTE_FEASIBILITIES)[number];
type VisaRestriction = (typeof VISA_RESTRICTIONS)[number];
type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];
type TechMismatchLevel = (typeof TECH_MISMATCH_LEVELS)[number];
type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];
type InfraDepth = (typeof INFRA_DEPTHS)[number];

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
  seniority_level: SeniorityLevel;
  infra_depth: InfraDepth;
}

// ─── Scoring prompt ───────────────────────────────────────────────────────────

function buildScorePrompt(description: string): string {
  const p = CANDIDATE_PROFILE;
  return `You are a job classification and scoring engine. Return ONLY valid JSON. No explanation. No markdown. No commentary. Fill every key in the required structure. Salary fields must be numbers or null.

CANDIDATE PROFILE:
- Based in ${p.currentLocation}. Has UK settled status. Fully eligible to work in the UK.
- Willing to relocate to the UK for the right role.
- Remote work is preferred. UK hybrid and UK onsite roles are acceptable.
- Target level: mid-level individual contributor (roughly 3-5 years). NOT positioned as senior, lead, staff, or principal.
- Core stack: ${p.coreStack.join(', ')}.
- Strengths: ${p.strengths.join(', ')}.
- Infrastructure profile: familiar with basic cloud/AWS concepts but NOT an infrastructure engineer. No Terraform, ECS, EventBridge, SNS, IaC ownership, or platform/DevOps specialist experience.
- US roles must be treated much more strictly — only viable if explicitly international-friendly or sponsorship-compatible.

TARGET ROLES (in priority order):
- product_engineer
- technical_support
- implementation_engineer
- qa_automation
- other
- reject

══════════════════════════════════════════
SCORING RULES — READ ALL BEFORE SCORING
══════════════════════════════════════════

STEP 1 — CLASSIFY SENIORITY LEVEL (seniority_level field):
- "junior":    explicit graduate / junior / entry-level / 0-2 years
- "mid":       3-5 years explicitly, or no seniority signal at all
- "senior":    title or body contains Senior, 5+ years, or "5 years+"
- "lead_plus": title or body contains Lead, Staff, Principal, Architect, Head of, VP, Director
- "unknown":   cannot determine
RULE: Classify from the job title first, then body. Do NOT infer from tone or responsibility language.

STEP 2 — CLASSIFY INFRASTRUCTURE DEPTH (infra_depth field):
- "none":  no infrastructure requirements
- "light": some AWS/cloud mentions (S3, Lambda basics) but no ownership or specialist depth required
- "heavy": role explicitly requires ownership or specialist depth in ANY of:
    Terraform, ECS, EventBridge, SNS, SQS, Kubernetes, Helm, CI/CD pipeline ownership,
    cloud infrastructure design, microservices platform ownership, IaC, GitOps, CDK, Pulumi,
    DevOps ownership, platform engineering, "you will own the infrastructure"
RULE: If two or more heavy signals are present, always output "heavy". One strong signal alone is also "heavy".

STEP 3 — SCORE STACK FIT (positive signals):
Positive score contribution from: TypeScript, React, Next.js, Node.js, REST APIs, Postgres, SaaS, integrations, debugging, workflow systems.
These are ADDITIVE but cannot push the score above ceilings set in step 4/5.

STEP 4 — APPLY SENIORITY CEILING to your raw score:
- seniority "junior" or "mid": no ceiling from seniority
- seniority "senior": your score MUST NOT exceed 74
- seniority "lead_plus": your score MUST NOT exceed 64
Reason: candidate is not positioned for senior/lead roles. Stack keyword match is irrelevant if level is wrong.
Add to red_flags: "Role is explicitly senior — exceeds candidate level" or "Role is lead/staff/principal — significantly exceeds candidate level"

STEP 5 — APPLY INFRA DEPTH CEILING on top of seniority ceiling:
- infra_depth "none" or "light": no additional ceiling
- infra_depth "heavy": subtract 10 from the seniority-adjusted ceiling (minimum ceiling 40)
Reason: infrastructure depth is outside candidate's profile even if the application stack matches.
Add to red_flags: "Infrastructure ownership depth (Terraform/ECS/platform) exceeds candidate profile"

EXAMPLE: Senior role + heavy infra → seniority ceiling 74, minus 10 for infra = final ceiling 64. Score cannot exceed 64.
EXAMPLE: Lead role + heavy infra → seniority ceiling 64, minus 10 for infra = final ceiling 54.
EXAMPLE: Mid role + heavy infra → no seniority ceiling, minus 10 from 100 = ceiling 90 (then infra cap below).

STEP 6 — TECH MISMATCH:
- "none": core stack aligns (TypeScript, React, REST APIs, SaaS)
- "some": partial match — notable gaps the candidate could ramp on
- "major": core required stack is entirely outside candidate experience (Django, Java, mobile-native, DBA-heavy, embedded, .NET-only)
NOTE: AWS/Terraform/infra requirements alone do NOT make tech_mismatch "major" — that is captured by infra_depth. Use "some" if AWS is secondary to a TypeScript/Node core.
tech_mismatch must be true only when tech_mismatch_level is "major".

OTHER RULES:
- Do NOT treat UK location or right-to-work as negative — candidate is fully UK-eligible.
- Do NOT reject a UK role because candidate is in Latvia — relocation is intended.
- Handle US roles much more strictly (visa/sponsorship required).
- Do not invent experience, seniority, or leadership claims.
- onsite_required: true only if explicitly onsite-only or no remote option stated.

Experience band:
- "5+": posting has Senior, Staff, Lead, Principal, or "5+ years"
- "0-2": graduate/junior/entry-level/0-2 years
- "3-5": explicit 3-5 years
- default "3-5" if nothing stated

Scoring scale (AFTER applying all ceilings above):
- 85–100: Exceptional fit (only possible for mid/junior roles with good stack match)
- 75–84: Strong fit
- 65–74: Moderate fit
- 50–64: Weak fit / possible match
- 0–49: Poor fit

REQUIRED JSON STRUCTURE:
{
  "role_category": "",
  "score": 0,
  "experience_band": "0-2|3-5|5+|unknown",
  "remote_feasibility": "good|maybe|no",
  "reasons": ["positive reason 1", "positive reason 2"],
  "red_flags": ["mismatch reason 1", "mismatch reason 2"],
  "onsite_required": false,
  "visa_restriction": "none|uk_only|us_only|eu_only|unknown",
  "salary_min_gbp": null,
  "salary_max_gbp": null,
  "salary_currency": "GBP|EUR|USD|CAD|AUD|unknown",
  "tech_mismatch_level": "none|some|major",
  "tech_mismatch": false,
  "seniority_level": "junior|mid|senior|lead_plus|unknown",
  "infra_depth": "none|light|heavy"
}

JOB DESCRIPTION:
${description}`;
}

// ─── scoreJob ─────────────────────────────────────────────────────────────────

export async function scoreJob(description: string, job?: { remote?: unknown }): Promise<JobScore> {
  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_SCORER_MODEL ?? 'gemini-2.5-flash',
    contents: buildScorePrompt(description),
    config: { responseMimeType: 'application/json', temperature: 0 },
  });

  const content = response.text;
  if (!content) {
    throw new Error('scoreJob: Gemini returned an empty response');
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

  // ── Normalize tech_mismatch_level ───────────────────────────────────────────
  let tml = (data.tech_mismatch_level as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!TECH_MISMATCH_LEVEL_SET.has(tml)) tml = 'some';
  data.tech_mismatch_level = tml as TechMismatchLevel;
  data.tech_mismatch = tml === 'major';

  // ── Normalize seniority_level ────────────────────────────────────────────────
  let sl = (data.seniority_level as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!SENIORITY_LEVEL_SET.has(sl)) sl = 'unknown';
  data.seniority_level = sl as SeniorityLevel;

  // ── Normalize infra_depth ────────────────────────────────────────────────────
  let id_ = (data.infra_depth as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!INFRA_DEPTH_SET.has(id_)) id_ = 'none';
  data.infra_depth = id_ as InfraDepth;

  // ── Deterministic infra_depth override (weighted) ───────────────────────────
  // The LLM frequently under-classifies infra depth. Override when description
  // contains unambiguous signals the LLM should have caught.
  {
    const STRONG_SIGNALS = [
      'ecs', 'sqs', 'sns', 'eventbridge', 'kubernetes', ' k8s', 'helm',
      'terraform', 'pulumi', ' cdk ', ' iac ', 'gitops',
      'platform engineering', 'devops engineer',
    ];
    const OWNERSHIP_PHRASES = [
      'you will own', 'ownership of', 'responsible for infrastructure',
      'manage the infrastructure', 'microservices architecture',
      'microservice architecture', 'build and maintain the platform',
    ];
    const LIGHT_SIGNALS = ['lambda', ' s3 ', 's3,', 's3.', ' ec2', ' aws', 'gcp', 'azure'];

    const descL = description.toLowerCase();
    const strongCount = STRONG_SIGNALS.filter(s => descL.includes(s)).length;
    const ownershipHit = OWNERSHIP_PHRASES.some(p => descL.includes(p));
    const lightCount = LIGHT_SIGNALS.filter(s => descL.includes(s)).length;

    if (strongCount >= 2 || (strongCount >= 1 && ownershipHit)) {
      // Multiple strong signals, or one strong signal plus ownership language → heavy
      if (id_ !== 'heavy') {
        id_ = 'heavy';
        data.infra_depth = 'heavy';
      }
    } else if (strongCount === 1) {
      // Single strong signal without ownership language → at least light
      if (id_ === 'none') {
        id_ = 'light';
        data.infra_depth = 'light';
      }
    } else if (lightCount >= 1 && id_ === 'none') {
      // Basic cloud tools present → light
      id_ = 'light';
      data.infra_depth = 'light';
    }
    // Never downgrade a higher LLM classification
  }

  // ── Deterministic score ceilings ────────────────────────────────────────────
  const redFlags: string[] = Array.isArray(data.red_flags) ? data.red_flags as string[] : [];
  let ceiling = 100;

  if (sl === 'senior') {
    ceiling = Math.min(ceiling, CANDIDATE_PROFILE.seniorityCeilings.senior);
    if (!redFlags.some(f => f.toLowerCase().includes('senior'))) {
      redFlags.push('Role is explicitly senior — exceeds candidate level');
    }
  } else if (sl === 'lead_plus') {
    ceiling = Math.min(ceiling, CANDIDATE_PROFILE.seniorityCeilings.lead_plus);
    if (!redFlags.some(f => f.toLowerCase().includes('lead') || f.toLowerCase().includes('staff') || f.toLowerCase().includes('principal'))) {
      redFlags.push('Role is lead/staff/principal — significantly exceeds candidate level');
    }
  }

  if (id_ === 'heavy') {
    ceiling = Math.max(CANDIDATE_PROFILE.infraCeilingMin, ceiling - CANDIDATE_PROFILE.infraPenalty);
    if (!redFlags.some(f => f.toLowerCase().includes('infra'))) {
      redFlags.push('Infrastructure ownership depth (Terraform/ECS/platform) exceeds candidate profile');
    }
  }

  data.red_flags = redFlags;
  data.score = Math.min(data.score as number, ceiling);
  // ────────────────────────────────────────────────────────────────────────────

  // ── Region detection ───────────────────────────────────────────────────────
  const descriptionLower = description.toLowerCase();

  const isUS =
    data.visa_restriction === 'us_only' ||
    descriptionLower.includes('united states') ||
    descriptionLower.includes('usa') ||
    descriptionLower.includes('us only') ||
    descriptionLower.includes('u.s.');

  // ── US onsite cap ───────────────────────────────────────────────────────────
  if (data.onsite_required === true && isUS) {
    data.score = Math.min(data.score as number, 40);
  }

  // ── UK explicit-presence detection ──────────────────────────────────────────
  // Generic "UK remote" or "remote, UK" is fine — candidate is UK-eligible + willing to relocate.
  // Only flag when the description explicitly requires *current* UK physical presence.
  {
    const UK_PRESENCE_PATTERNS = [
      'must be currently based in the uk',
      'currently based in the uk',
      'uk residents only',
      'remote within the uk only',
      'must be based in the uk',
      'must have the right to work and be based in the uk',
    ];
    const rf2: string[] = Array.isArray(data.red_flags) ? data.red_flags as string[] : [];
    if (UK_PRESENCE_PATTERNS.some(p => descriptionLower.includes(p))) {
      if (data.remote_feasibility === 'good') data.remote_feasibility = 'maybe';
      if (!rf2.some(f => f.toLowerCase().includes('uk physical') || f.toLowerCase().includes('uk presence'))) {
        rf2.push('Role requires current UK physical presence — workable via relocation but not confirmed remote-friendly from abroad');
        data.red_flags = rf2;
      }
    }
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
    seniority_level: data.seniority_level as SeniorityLevel,
    infra_depth: data.infra_depth as InfraDepth,
  };
}
