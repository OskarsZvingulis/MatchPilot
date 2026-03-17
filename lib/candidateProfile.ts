/**
 * Candidate profile — single source of truth for scoring.
 * Edit this file to update geography, stack, seniority target, or salary floor.
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

  // Hard ceilings applied deterministically after LLM extraction
  seniorityCeilings: {
    senior:    68,  // was 74 — tighter cap for seniority stretch
    lead_plus: 58,  // was 64 — 10 below senior, same gap as before
  },

  // Ceilings for stack and infra quality
  scoreCeilings: {
    heavyInfra:           72,  // cap when infra_depth === 'heavy'
    adjacentStackOnly:    78,  // cap when 0 direct core stack matches (adjacent/vague only)
    fewDirectMatches:     85,  // cap when 1–2 direct core stack matches
    minDirectMatchesForFull: 3, // need 3+ direct matches to skip the 85 cap
  },

  // Deterministic penalties (subtracted from raw_score before ceiling)
  penalties: {
    seniorityStretch:     12,  // senior or lead_plus role
    infraMismatch:        10,  // heavy infra depth
    vagueStackEvidence:    8,  // 0 direct core stack matches
    hybridOnsiteFriction:  6,  // onsite/hybrid required for UK role
    hardWorkabilityBlocker: 20, // hard workability blocker (short of full ineligible)
  },

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

  // ─── Legacy aliases (kept for reference) ──────────────────────────────────
  infraPenalty:        10,   // == penalties.infraMismatch
  techMismatchSomeCap: 78,   // updated from 74 to align with scoreCeilings.adjacentStackOnly
} as const;

export type CandidateProfile = typeof CANDIDATE_PROFILE;
