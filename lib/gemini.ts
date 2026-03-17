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

const GEOGRAPHY_WORKABILITY_VALUES = [
  'uk_remote', 'uk_hybrid', 'uk_onsite',
  'us_remote', 'us_onsite',
  'eu_remote', 'eu_onsite',
  'global_remote', 'unknown',
] as const;
const GEOGRAPHY_WORKABILITY_SET = new Set<string>(GEOGRAPHY_WORKABILITY_VALUES);

type RoleCategory       = (typeof ROLE_CATEGORIES)[number];
type ExperienceBand     = (typeof EXPERIENCE_BANDS)[number];
type RemoteFeasibility  = (typeof REMOTE_FEASIBILITIES)[number];
type VisaRestriction    = (typeof VISA_RESTRICTIONS)[number];
type SalaryCurrency     = (typeof SALARY_CURRENCIES)[number];
type TechMismatchLevel  = (typeof TECH_MISMATCH_LEVELS)[number];
type SeniorityLevel     = (typeof SENIORITY_LEVELS)[number];
type InfraDepth         = (typeof INFRA_DEPTHS)[number];
type GeographyWorkability = (typeof GEOGRAPHY_WORKABILITY_VALUES)[number];

// ─── Extraction type ───────────────────────────────────────────────────────────
// Gemini extracts signals only. Final score and recommendation are derived
// deterministically in scoringPipeline.ts.

export interface JobExtraction {
  // Role classification
  role_category:       RoleCategory;
  seniority_level:     SeniorityLevel;

  // Stack signals — used for deterministic ceiling/penalty logic
  direct_match_signals:   string[];  // core stack terms explicitly in job text
  adjacent_match_signals: string[];  // similar but not core stack
  stretch_signals:        string[];  // clear gaps candidate does not have

  // Depth signals
  infra_depth:            InfraDepth;
  management_expectation: boolean;   // role expects managing people

  // Geography & work mode
  geography_workability:  GeographyWorkability;
  remote_feasibility:     RemoteFeasibility;
  onsite_required:        boolean;

  // Textual signals
  blockers:       string[];  // informational — pipeline decides final blockers
  reasons_for:    string[];  // positive signals
  reasons_against: string[]; // negative signals

  // LLM's rough estimate — informational only, pipeline overrides
  raw_score: number;

  // Legacy fields kept for DB compatibility and pipeline blocker logic
  experience_band:  ExperienceBand;
  visa_restriction: VisaRestriction;
  salary_min_gbp:   number | null;
  salary_max_gbp:   number | null;
  salary_currency:  SalaryCurrency;
  tech_mismatch:    boolean;
  tech_mismatch_level: TechMismatchLevel;
}

// Backward-compat alias
export type JobScore = JobExtraction;

// ─── Extraction prompt ─────────────────────────────────────────────────────────

function buildExtractionPrompt(description: string): string {
  const p = CANDIDATE_PROFILE;
  return `You are a job signal extractor. Extract structured signals from the job description below. Return ONLY valid JSON. No explanation. No markdown. Fill every key.

CANDIDATE PROFILE:
- Based in ${p.currentLocation}. UK settled status. Fully eligible to work in the UK.
- Willing to relocate to the UK for the right role. Latvia location is NOT a blocker for UK roles.
- Remote preferred. UK hybrid and UK onsite roles are acceptable (assumes relocation).
- Target level: mid-level individual contributor (~3-5 years). NOT positioned as senior, lead, staff, or principal.
- Core stack: ${p.coreStack.join(', ')}.
- NOT an infrastructure engineer. No Terraform, ECS, Kubernetes, IaC ownership, or platform/DevOps specialist experience.
- US roles: only viable if explicitly international-friendly or sponsorship-compatible.

══════════════════════════════════════════
EXTRACTION RULES
══════════════════════════════════════════

1. direct_match_signals
   List ONLY technology/skills from the job text that also appear in the core stack above.
   Core stack includes: TypeScript, JavaScript, React, Next.js, Node.js, REST APIs, Postgres/PostgreSQL, SQL, Supabase.
   Do NOT include Vue, Angular, Python, etc. even if similar. Empty array is valid.

2. adjacent_match_signals
   Technology/skills similar to but NOT in the core stack.
   Examples: Vue, Angular, Python, FastAPI, Ruby, Rails, MySQL, MongoDB, modern web frameworks.

3. stretch_signals
   Technology/skills the candidate clearly lacks.
   Examples: Terraform, Kubernetes, ECS, Helm, IaC, platform engineering, .NET, Java, mobile-native, embedded.

4. seniority_level
   - "junior":    explicit graduate / junior / entry-level / 0-2 years
   - "mid":       3-5 years explicitly, or NO seniority signal at all (DEFAULT)
   - "senior":    title or body contains Senior, 5+ years, "5 years+"
   - "lead_plus": title or body contains Lead, Staff, Principal, Architect, Head of, VP, Director
   - "unknown":   cannot determine
   Classify from job TITLE first, then body. Do NOT infer from responsibility language.

5. infra_depth
   - "none":  no infrastructure requirements
   - "light": some AWS/cloud mentions (S3, Lambda basics) but no ownership or specialist depth required
   - "heavy": role explicitly requires ownership or specialist depth in ANY of:
       Terraform, ECS, EventBridge, SNS, SQS, Kubernetes, Helm, CI/CD pipeline ownership,
       cloud infrastructure design, IaC, GitOps, CDK, Pulumi, DevOps ownership, platform engineering,
       "you will own the infrastructure"
   RULE: 2+ heavy signals → "heavy". One strong signal alone → "heavy". One mention without ownership → "light".

6. management_expectation
   true ONLY if role explicitly expects managing/leading a team of people.

7. onsite_required
   true if the job requires ANY office attendance, including hybrid patterns.
   Examples that are TRUE: "3 days in office", "hybrid 3 days/week", "must commute to London",
     "2 days remote 3 days onsite", "onsite required".
   Examples that are FALSE: "fully remote", "remote-first", no mention of office.

8. remote_feasibility
   - "good":  fully remote or explicitly internationally remote
   - "maybe": hybrid (requires commuting), or requires UK physical presence (achievable via relocation)
   - "no":    US-only or requires immediate physical presence impossible via relocation

9. geography_workability
   One of: "uk_remote", "uk_hybrid", "uk_onsite", "us_remote", "us_onsite",
           "eu_remote", "eu_onsite", "global_remote", "unknown"
   IMPORTANT: UK roles are eligible by default. Do NOT classify UK as negative.
   Latvia is NOT a blocker for UK roles — candidate will relocate.
   "us_onsite" or "us_remote" = strict (requires US authorization).

10. visa_restriction
    - "uk_only": "must have right to work in UK", "no sponsorship available" (UK-specific)
    - "us_only": "must be authorized to work in US", "no visa sponsorship" (US-specific)
    - "eu_only": "EU work authorization required"
    - "none":    no explicit restriction, or international OK
    - "unknown": unclear
    NOTE: "right to work in the UK" alone is NOT a hard blocker — candidate has UK settled status.

11. blockers (informational — final decision is made in code, not here)
    Include only clear hard blockers:
    - US-only work authorization
    - EU-only work authorization (uncertain eligibility)
    - Explicit salary below £45,000
    - Clearly non-software role (sales, HR, accounting, etc.)
    Do NOT include: UK right-to-work, Latvia location, seniority mismatch.

12. reasons_for
    Positive signals: stack match, domain fit, good remote setup, relevant role type, etc.

13. reasons_against
    Negative signals: seniority stretch, infra gap, weak stack match, salary concern, etc.
    Include the concrete reason, e.g., "Senior title — above mid-level target".

14. raw_score (0–100)
    Your rough estimate of stack and domain fit, IGNORING seniority/infra constraints.
    Base purely on: does the technology stack match? Is the domain relevant?
    This value is informational — the pipeline computes the final score deterministically.

15. experience_band
    - "5+":     Senior/Lead/Staff/Principal or "5+ years"
    - "0-2":    graduate/junior/entry-level/0-2 years
    - "3-5":    explicit 3-5 years, or no signal (DEFAULT)
    - "unknown": cannot determine

16. salary
    Extract salary_min_gbp, salary_max_gbp, salary_currency if explicitly stated.
    Convert to GBP equivalent if in other currency when obvious. Null if not stated.

17. tech_mismatch_level
    - "none":  core required stack aligns with candidate (TypeScript, React, Node, etc.)
    - "some":  partial match — notable gaps candidate could ramp on
    - "major": core required stack is entirely outside candidate experience (Java, .NET, mobile-native, embedded)
    Do NOT mark "major" for infrastructure requirements alone — those are captured by infra_depth.
    tech_mismatch = true ONLY when tech_mismatch_level is "major".

REQUIRED JSON:
{
  "role_category": "product_engineer|technical_support|implementation_engineer|qa_automation|other|reject",
  "seniority_level": "junior|mid|senior|lead_plus|unknown",
  "direct_match_signals": [],
  "adjacent_match_signals": [],
  "stretch_signals": [],
  "infra_depth": "none|light|heavy",
  "management_expectation": false,
  "geography_workability": "uk_remote|uk_hybrid|uk_onsite|us_remote|us_onsite|eu_remote|eu_onsite|global_remote|unknown",
  "remote_feasibility": "good|maybe|no",
  "onsite_required": false,
  "blockers": [],
  "reasons_for": [],
  "reasons_against": [],
  "raw_score": 75,
  "experience_band": "0-2|3-5|5+|unknown",
  "visa_restriction": "none|uk_only|us_only|eu_only|unknown",
  "salary_min_gbp": null,
  "salary_max_gbp": null,
  "salary_currency": "GBP|EUR|USD|CAD|AUD|unknown",
  "tech_mismatch_level": "none|some|major",
  "tech_mismatch": false
}

JOB DESCRIPTION:
${description}`;
}

// ─── extractJob ───────────────────────────────────────────────────────────────

export async function extractJob(description: string, job?: { remote?: unknown }): Promise<JobExtraction> {
  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_SCORER_MODEL ?? 'gemini-2.5-flash',
    contents: buildExtractionPrompt(description),
    config: { responseMimeType: 'application/json', temperature: 0 },
  });

  const content = response.text;
  if (!content) {
    throw new Error('extractJob: Gemini returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`extractJob: Failed to parse JSON — ${content}`);
  }

  const data = parsed as Record<string, unknown>;

  // ── Normalize remote_feasibility ─────────────────────────────────────────
  const allowed = ['good', 'maybe', 'no'];
  let rf: string = (data.remote_feasibility as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!allowed.includes(rf)) {
    rf = job?.remote === true ? 'maybe' : 'no';
  }
  data.remote_feasibility = rf;

  // ── Normalize tech_mismatch_level ─────────────────────────────────────────
  let tml = (data.tech_mismatch_level as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!TECH_MISMATCH_LEVEL_SET.has(tml)) tml = 'some';
  data.tech_mismatch_level = tml as TechMismatchLevel;
  data.tech_mismatch = tml === 'major';

  // ── Normalize seniority_level ─────────────────────────────────────────────
  let sl = (data.seniority_level as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!SENIORITY_LEVEL_SET.has(sl)) sl = 'unknown';
  data.seniority_level = sl as SeniorityLevel;

  // ── Normalize infra_depth ─────────────────────────────────────────────────
  let id_ = (data.infra_depth as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!INFRA_DEPTH_SET.has(id_)) id_ = 'none';
  data.infra_depth = id_ as InfraDepth;

  // ── Normalize geography_workability ──────────────────────────────────────
  let gw = (data.geography_workability as string | undefined)?.toLowerCase?.().trim() ?? '';
  if (!GEOGRAPHY_WORKABILITY_SET.has(gw)) gw = 'unknown';
  data.geography_workability = gw as GeographyWorkability;

  // ── Normalize array fields ────────────────────────────────────────────────
  if (!Array.isArray(data.direct_match_signals))   data.direct_match_signals   = [];
  if (!Array.isArray(data.adjacent_match_signals)) data.adjacent_match_signals = [];
  if (!Array.isArray(data.stretch_signals))        data.stretch_signals        = [];
  if (!Array.isArray(data.blockers))               data.blockers               = [];
  if (!Array.isArray(data.reasons_for))            data.reasons_for            = [];
  if (!Array.isArray(data.reasons_against))        data.reasons_against        = [];

  // ── Normalize management_expectation ──────────────────────────────────────
  if (typeof data.management_expectation !== 'boolean') data.management_expectation = false;

  // ── Normalize raw_score ───────────────────────────────────────────────────
  const rawScoreNum = Number(data.raw_score);
  if (!Number.isFinite(rawScoreNum) || rawScoreNum < 0 || rawScoreNum > 100) {
    data.raw_score = 50;
  } else {
    data.raw_score = rawScoreNum;
  }

  // ── Deterministic infra_depth override ────────────────────────────────────
  // LLM frequently under-classifies infra depth. Override on unambiguous signals.
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
    const lightCount   = LIGHT_SIGNALS.filter(s => descL.includes(s)).length;

    if (strongCount >= 2 || (strongCount >= 1 && ownershipHit)) {
      if (id_ !== 'heavy') {
        id_ = 'heavy';
        data.infra_depth = 'heavy';
      }
    } else if (strongCount === 1) {
      if (id_ === 'none') {
        id_ = 'light';
        data.infra_depth = 'light';
      }
    } else if (lightCount >= 1 && id_ === 'none') {
      id_ = 'light';
      data.infra_depth = 'light';
    }
    // Never downgrade a higher LLM classification
  }

  // ── UK immediate-presence detection ──────────────────────────────────────
  // Only flag when the job explicitly requires CURRENT UK physical presence
  // that realistically cannot be satisfied via relocation.
  // Generic "remote within UK" or "must be based in the UK" is fine — candidate
  // has UK settled status and is willing to relocate.
  {
    const UK_IMMEDIATE_PRESENCE_PATTERNS = [
      'must be currently based in the uk',
      'currently based in the uk',
      'uk residents only',
      'must have the right to work and be based in the uk',
    ];
    const descL = description.toLowerCase();
    const reasonsAgainst: string[] = Array.isArray(data.reasons_against) ? data.reasons_against as string[] : [];
    if (UK_IMMEDIATE_PRESENCE_PATTERNS.some(p => descL.includes(p))) {
      if (data.remote_feasibility === 'good') data.remote_feasibility = 'maybe';
      if (!reasonsAgainst.some(f => f.toLowerCase().includes('uk physical') || f.toLowerCase().includes('uk presence'))) {
        reasonsAgainst.push('Role requires current UK physical presence — workable via relocation but timeline may be a factor');
        data.reasons_against = reasonsAgainst;
      }
    }
  }

  // ── Validate required enum fields ─────────────────────────────────────────
  if (typeof data.role_category !== 'string' || !(ROLE_CATEGORIES as readonly string[]).includes(data.role_category)) {
    throw new Error(
      `extractJob: invalid "role_category" "${data.role_category}" — must be one of: ${ROLE_CATEGORIES.join(', ')}`,
    );
  }
  if (typeof data.experience_band !== 'string' || !(EXPERIENCE_BANDS as readonly string[]).includes(data.experience_band)) {
    data.experience_band = '3-5'; // safe default
  }
  if (typeof data.remote_feasibility !== 'string' || !(REMOTE_FEASIBILITIES as readonly string[]).includes(data.remote_feasibility)) {
    throw new Error(
      `extractJob: invalid "remote_feasibility" "${data.remote_feasibility}"`,
    );
  }
  if (typeof data.onsite_required !== 'boolean') {
    data.onsite_required = false;
  }
  if (typeof data.visa_restriction !== 'string' || !(VISA_RESTRICTIONS as readonly string[]).includes(data.visa_restriction)) {
    data.visa_restriction = 'unknown';
  }
  if (data.salary_min_gbp !== null && typeof data.salary_min_gbp !== 'number') {
    data.salary_min_gbp = null;
  }
  if (data.salary_max_gbp !== null && typeof data.salary_max_gbp !== 'number') {
    data.salary_max_gbp = null;
  }
  if (typeof data.salary_currency !== 'string' || !(SALARY_CURRENCIES as readonly string[]).includes(data.salary_currency)) {
    data.salary_currency = 'unknown';
  }

  return {
    role_category:          data.role_category as RoleCategory,
    seniority_level:        data.seniority_level as SeniorityLevel,
    direct_match_signals:   data.direct_match_signals as string[],
    adjacent_match_signals: data.adjacent_match_signals as string[],
    stretch_signals:        data.stretch_signals as string[],
    infra_depth:            data.infra_depth as InfraDepth,
    management_expectation: data.management_expectation as boolean,
    geography_workability:  data.geography_workability as GeographyWorkability,
    remote_feasibility:     data.remote_feasibility as RemoteFeasibility,
    onsite_required:        data.onsite_required as boolean,
    blockers:               data.blockers as string[],
    reasons_for:            data.reasons_for as string[],
    reasons_against:        data.reasons_against as string[],
    raw_score:              data.raw_score as number,
    experience_band:        data.experience_band as ExperienceBand,
    visa_restriction:       data.visa_restriction as VisaRestriction,
    salary_min_gbp:         data.salary_min_gbp as number | null,
    salary_max_gbp:         data.salary_max_gbp as number | null,
    salary_currency:        data.salary_currency as SalaryCurrency,
    tech_mismatch:          data.tech_mismatch as boolean,
    tech_mismatch_level:    data.tech_mismatch_level as TechMismatchLevel,
  };
}

// Backward-compat alias — callers can update to extractJob gradually
export const scoreJob = extractJob;
