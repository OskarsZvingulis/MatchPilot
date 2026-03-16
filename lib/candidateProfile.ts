/**
 * Candidate profile — single source of truth for scoring.
 * Edit this file to update geography, stack, seniority target, or salary floor.
 * No redeploy of prompt logic required — openai.ts reads from here.
 */

export const CANDIDATE_PROFILE = {
  // ─── Geography & Work Authorization ───────────────────────────────────────
  currentLocation:   'Latvia',
  ukEligible:        true,   // UK settled status — fully eligible, no restriction
  willingToRelocateToUK: true,

  // Work modes accepted
  workModes: {
    remote:    true,   // preferred
    ukHybrid:  true,   // acceptable (assumes relocation)
    ukOnsite:  true,   // acceptable (assumes relocation)
    nonUkOnsite: false,
  },

  // US roles require explicit sponsorship/international signal — score very strictly
  usRolesRequireExplicitSponsorOrRemote: true,

  // ─── Seniority Target ─────────────────────────────────────────────────────
  // mid-level IC: ~3-5 years. NOT senior, lead, staff, principal.
  targetSeniority: 'mid' as const,

  // Score ceilings applied deterministically after LLM response
  seniorityCeilings: {
    senior:    74,
    lead_plus: 64,
  },

  // ─── Infrastructure Depth ─────────────────────────────────────────────────
  // Familiar with basic AWS concepts but NOT an infra engineer
  infraPenalty: 10,     // subtracted from ceiling when infra_depth === 'heavy'
  infraCeilingMin: 40,  // floor: ceiling never goes below this

  // ─── Tech Stack ───────────────────────────────────────────────────────────
  coreStack: [
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js',
    'REST APIs', 'Supabase', 'Postgres', 'SQL',
  ],

  strengths: [
    'API integrations', 'debugging', 'business-to-technical translation',
    'workflow-heavy SaaS systems',
  ],

  outOfProfile: [
    'Terraform', 'ECS', 'EventBridge', 'SNS', 'SQS', 'Kubernetes',
    'IaC ownership', 'platform engineering', 'DevOps ownership',
    'mobile-native (iOS/Android)', 'embedded systems',
    'Java-only', '.NET-only', 'Django-only',
  ],

  // ─── Target Role Categories ────────────────────────────────────────────────
  // In priority order — maps to role_category enum in scoring
  targetRoles: [
    'product_engineer',
    'technical_support',
    'implementation_engineer',
    'qa_automation',
    'other',
    'reject',
  ] as const,

  // ─── Salary Floor ─────────────────────────────────────────────────────────
  salaryFloorGbp: 45_000,

  // ─── Tech mismatch score cap ──────────────────────────────────────────────
  techMismatchSomeCap: 74,  // score capped at 74 when tech_mismatch_level === 'some'
} as const;

export type CandidateProfile = typeof CANDIDATE_PROFILE;
