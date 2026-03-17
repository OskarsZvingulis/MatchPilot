/**
 * Benchmark: run extractJob against known test cases and derive recommendation
 * using the same deterministic logic as scoringPipeline.ts.
 * Usage: npx tsx --env-file=.env.local scripts/benchmark-score.ts
 */
import { extractJob, type JobExtraction } from '../lib/gemini';
import { CANDIDATE_PROFILE } from '../lib/candidateProfile';

const P = CANDIDATE_PROFILE;

const CASES = [
  {
    label: '1. ARC IT — Full Stack Developer (should be possible_match ~80–86)',
    description: `Full Stack Developer at Arc IT Recruitment.
Salary: £50,000 - £60,000 per annum.
Location: Remote, UK-based.

About the role:
We are looking for a Full Stack Developer to join a fast-growing SaaS product team.
You will build and ship product features across our web application, working closely with
product and design. The role is primarily product-focused — building customer-facing features,
integrations, and internal tooling.

Tech stack: React, Node.js, Jest, Cypress. Ruby on Rails is a nice to have but not essential.
We use AWS: EC2, ECS, Lambda, S3, SQS. MongoDB and PostgreSQL for data storage.
Our system is microservices-based. You won't be responsible for infrastructure ownership
but familiarity with cloud environments is useful.

Requirements:
- 3+ years of experience with React and Node.js
- Strong JavaScript / TypeScript skills
- Experience writing tests (Jest, Cypress)
- Comfortable working in a cloud environment (AWS)
- Nice to have: Ruby, MongoDB`,
    remote: true,
    expected: ['possible_match'],
  },
  {
    label: '2. Clean product-engineer (should be strong_match or possible_match)',
    description: `Software Engineer — SaaS Product Team.
Location: Remote (anywhere in Europe welcome).
Salary: £55,000 - £70,000.
We build a workflow automation product for SMBs. Stack: TypeScript, React, Next.js, Node.js, PostgreSQL, REST APIs.
You will build product features end to end. No infrastructure ownership required.
3-5 years experience. Mid-level role.`,
    remote: true,
    expected: ['strong_match', 'possible_match'],
  },
  {
    label: '3. Google/Randstad Engineer III — senior + heavy infra (should be weak_match ~60–68)',
    description: `Senior Platform Engineer.
Location: London, UK (hybrid).
Salary: £90,000 - £110,000.
We need a Senior Platform Engineer to own our cloud infrastructure.
You will own and operate our Kubernetes clusters, Terraform modules, and CI/CD pipelines.
Manage ECS deployments, Terraform IaC, GitOps with Helm. Lead platform engineering.
5+ years infrastructure engineering required. Extensive AWS: ECS, EventBridge, SNS, SQS.
Kubernetes, Helm, Pulumi. You will own the infrastructure roadmap.`,
    remote: false,
    expected: ['weak_match', 'ineligible'],
  },
  {
    label: '4. US-only onsite role (must be ineligible)',
    description: `Software Engineer — New York, NY.
Location: New York City, onsite required. US citizens and permanent residents only. No visa sponsorship.
Salary: $120,000 - $150,000.
Stack: React, TypeScript, Node.js, PostgreSQL.`,
    remote: false,
    expected: ['ineligible'],
  },
];

function isUSRole(extraction: JobExtraction): boolean {
  return (
    extraction.visa_restriction === 'us_only' ||
    extraction.geography_workability === 'us_remote' ||
    extraction.geography_workability === 'us_onsite'
  );
}

function computeScore(extraction: JobExtraction): { score: number; log: string[] } {
  const log: string[] = [];
  let ceiling  = 100;
  let rawScore = extraction.raw_score;

  if (extraction.seniority_level === 'senior') {
    ceiling = Math.min(ceiling, P.seniorityCeilings.senior);
    rawScore -= P.penalties.seniorityStretch;
    log.push(`senior_ceiling:${P.seniorityCeilings.senior}, -${P.penalties.seniorityStretch}`);
  } else if (extraction.seniority_level === 'lead_plus') {
    ceiling = Math.min(ceiling, P.seniorityCeilings.lead_plus);
    rawScore -= P.penalties.seniorityStretch;
    log.push(`lead_plus_ceiling:${P.seniorityCeilings.lead_plus}, -${P.penalties.seniorityStretch}`);
  }

  if (extraction.infra_depth === 'heavy') {
    ceiling = Math.min(ceiling, P.scoreCeilings.heavyInfra);
    rawScore -= P.penalties.infraMismatch;
    log.push(`heavy_infra_ceiling:${P.scoreCeilings.heavyInfra}, -${P.penalties.infraMismatch}`);
  }

  const directCount = extraction.direct_match_signals.length;
  if (directCount === 0) {
    ceiling = Math.min(ceiling, P.scoreCeilings.adjacentStackOnly);
    rawScore -= P.penalties.vagueStackEvidence;
    log.push(`adjacent_stack_only_ceiling:${P.scoreCeilings.adjacentStackOnly}, -${P.penalties.vagueStackEvidence}`);
  } else if (directCount < P.scoreCeilings.minDirectMatchesForFull) {
    ceiling = Math.min(ceiling, P.scoreCeilings.fewDirectMatches);
    log.push(`few_direct_matches_ceiling:${P.scoreCeilings.fewDirectMatches}(${directCount})`);
  }

  if (extraction.onsite_required && !isUSRole(extraction)) {
    rawScore -= P.penalties.hybridOnsiteFriction;
    log.push(`hybrid_onsite_friction:-${P.penalties.hybridOnsiteFriction}`);
  }

  return { score: Math.max(0, Math.min(rawScore, ceiling)), log };
}

function hasMajorStretch(extraction: JobExtraction): boolean {
  return (
    extraction.seniority_level === 'senior' ||
    extraction.seniority_level === 'lead_plus' ||
    extraction.infra_depth === 'heavy' ||
    extraction.management_expectation === true
  );
}

function deriveRecommendation(score: number, isIneligible: boolean, extraction: JobExtraction): string {
  if (isIneligible) return 'ineligible';
  if (score >= 86 && !hasMajorStretch(extraction)) return 'strong_match';
  if (score >= 72) return 'possible_match';
  return 'weak_match';
}

async function main() {
  for (const c of CASES) {
    console.log('\n' + '='.repeat(70));
    console.log(c.label);
    console.log('Expected: ' + c.expected.join(' or '));
    console.log('-'.repeat(70));
    try {
      const extraction = await extractJob(c.description, { remote: c.remote });

      // Deterministic blockers (mirrors scoringPipeline.ts)
      const blockers: string[] = [];
      if (extraction.visa_restriction === 'us_only') blockers.push('US-only work authorization');
      if (extraction.visa_restriction === 'eu_only')  blockers.push('EU-only work authorization');
      if (extraction.tech_mismatch_level === 'major') blockers.push('Core stack fundamentally outside profile');
      if (extraction.role_category === 'reject')      blockers.push('Non-target role category');

      const { score, log: scoreLog } = computeScore(extraction);
      const rec  = deriveRecommendation(score, blockers.length > 0, extraction);
      const pass = c.expected.includes(rec) ? '✓ PASS' : '✗ FAIL';

      console.log(`raw_score:           ${extraction.raw_score}`);
      console.log(`final_score:         ${score}`);
      console.log(`score_log:           ${scoreLog.join(' | ')}`);
      console.log(`seniority_level:     ${extraction.seniority_level}`);
      console.log(`infra_depth:         ${extraction.infra_depth}`);
      console.log(`tech_mismatch_level: ${extraction.tech_mismatch_level}`);
      console.log(`remote_feasibility:  ${extraction.remote_feasibility}`);
      console.log(`onsite_required:     ${extraction.onsite_required}`);
      console.log(`direct_matches:      [${extraction.direct_match_signals.join(', ')}]`);
      console.log(`adjacent_matches:    [${extraction.adjacent_match_signals.join(', ')}]`);
      console.log(`stretch_signals:     [${extraction.stretch_signals.join(', ')}]`);
      console.log('reasons_for:');
      extraction.reasons_for.forEach((r: string) => console.log('  + ' + r));
      console.log('reasons_against:');
      if (extraction.reasons_against.length === 0) console.log('  (none)');
      extraction.reasons_against.forEach((f: string) => console.log('  ! ' + f));
      if (blockers.length > 0) console.log('blockers: ' + blockers.join('; '));
      console.log(`=> recommendation:   ${rec}   ${pass}`);
    } catch (err) {
      console.log('ERROR: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}
main();
