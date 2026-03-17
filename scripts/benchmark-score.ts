/**
 * Benchmark: run scoreJob against 4 known test cases.
 * Usage: npx tsx --env-file=.env.local scripts/benchmark-score.ts
 */
import { scoreJob } from '../lib/gemini';

const CASES = [
  {
    label: '1. ARC IT — Full Stack Developer (failing case → should be possible_match)',
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
    expected: 'possible_match',
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
    expected: 'strong_match or possible_match',
  },
  {
    label: '3. Senior Platform Engineer — heavy infra (should be weak_match)',
    description: `Senior Platform Engineer.
Location: London, UK (hybrid).
Salary: £90,000 - £110,000.
We need a Senior Platform Engineer to own our cloud infrastructure.
You will own and operate our Kubernetes clusters, Terraform modules, and CI/CD pipelines.
Manage ECS deployments, Terraform IaC, GitOps with Helm. Lead platform engineering.
5+ years infrastructure engineering required. Extensive AWS: ECS, EventBridge, SNS, SQS.
Kubernetes, Helm, Pulumi. You will own the infrastructure roadmap.`,
    remote: false,
    expected: 'weak_match or ineligible',
  },
  {
    label: '4. US-only onsite role (must be ineligible)',
    description: `Software Engineer — New York, NY.
Location: New York City, onsite required. US citizens and permanent residents only. No visa sponsorship.
Salary: $120,000 - $150,000.
Stack: React, TypeScript, Node.js, PostgreSQL.`,
    remote: false,
    expected: 'ineligible',
  },
];

function deriveRecommendation(score: number, scoring: { infra_depth: string; remote_feasibility: string; tech_mismatch_level: string; seniority_level: string }, blockers: string[]) {
  let rec = score >= 85 ? 'strong_match' : score >= 75 ? 'possible_match' : score >= 65 ? 'weak_match' : 'weak_match';
  if (blockers.length > 0) return 'ineligible';
  if (rec === 'strong_match') {
    const hasHeavyInfra   = scoring.infra_depth === 'heavy';
    const hasWorkabilityQ = scoring.remote_feasibility !== 'good';
    const hasTechGap      = scoring.tech_mismatch_level !== 'none';
    const isOverSeniority = scoring.seniority_level === 'senior' || scoring.seniority_level === 'lead_plus';
    if (hasHeavyInfra || hasWorkabilityQ || hasTechGap || isOverSeniority) rec = 'possible_match';
  }
  return rec;
}

async function main() {
for (const c of CASES) {
  console.log('\n' + '='.repeat(70));
  console.log(c.label);
  console.log('Expected: ' + c.expected);
  console.log('-'.repeat(70));
  try {
    const result = await scoreJob(c.description, { remote: c.remote });

    // Derive blockers (minimal set for benchmark — mirrors scoringPipeline logic)
    const blockers: string[] = [];
    if (result.visa_restriction === 'us_only') blockers.push('US-only work authorization');
    if (result.tech_mismatch_level === 'major') blockers.push('Core stack fundamentally outside profile');

    const rec = deriveRecommendation(result.score, result, blockers);
    const pass = c.expected.includes(rec) ? '✓ PASS' : '✗ FAIL';

    console.log(`score:               ${result.score}`);
    console.log(`seniority_level:     ${result.seniority_level}`);
    console.log(`infra_depth:         ${result.infra_depth}`);
    console.log(`tech_mismatch_level: ${result.tech_mismatch_level}`);
    console.log(`remote_feasibility:  ${result.remote_feasibility}`);
    console.log(`visa_restriction:    ${result.visa_restriction}`);
    console.log('reasons:');
    result.reasons.forEach(r => console.log('  + ' + r));
    console.log('red_flags:');
    if (result.red_flags.length === 0) console.log('  (none)');
    result.red_flags.forEach(f => console.log('  ! ' + f));
    console.log(`=> recommendation:   ${rec}   ${pass}`);
  } catch (err) {
    console.log('ERROR: ' + (err instanceof Error ? err.message : String(err)));
  }
}
}
main();
