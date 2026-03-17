/**
 * Regression test: .NET / C# / Blazor role must never score above 60.
 * Usage: npx tsx --env-file=.env.local scripts/blazor-regression.ts
 */
import { extractJob, type JobExtraction } from '../lib/gemini';
import { CANDIDATE_PROFILE } from '../lib/candidateProfile';

const P = CANDIDATE_PROFILE;

const DESCRIPTION = `Software Developer — .NET / Blazor
Location: London, UK (hybrid, 2 days onsite)
Salary: £55,000 - £70,000

We are looking for a .NET Developer to join our product team. This role is primarily focused
on building and maintaining our customer-facing web application using Blazor WebAssembly.

Requirements:
- 2+ years commercial Blazor experience (ESSENTIAL)
- Strong C# and .NET 6/7/8 skills
- Experience with Blazor WebAssembly or Blazor Server
- Entity Framework Core, SQL Server
- REST API integration
- Nice to have: Azure, SignalR

You will own feature development in Blazor, write C# backend services, and integrate
with our REST APIs. No TypeScript or React experience required or expected.`;

function isUSRole(e: JobExtraction): boolean {
  return e.visa_restriction === 'us_only' || e.geography_workability === 'us_remote' || e.geography_workability === 'us_onsite';
}

function computeScore(e: JobExtraction): { score: number; log: string[] } {
  const log: string[] = [];
  let ceiling = 100, raw = e.raw_score;

  if (e.seniority_level === 'senior') {
    ceiling = Math.min(ceiling, P.seniorityCeilings.senior); raw -= P.penalties.seniorityStretch;
    log.push(`senior_ceiling:${P.seniorityCeilings.senior},-${P.penalties.seniorityStretch}`);
  } else if (e.seniority_level === 'lead_plus') {
    ceiling = Math.min(ceiling, P.seniorityCeilings.lead_plus); raw -= P.penalties.seniorityStretch;
    log.push(`lead_plus_ceiling:${P.seniorityCeilings.lead_plus},-${P.penalties.seniorityStretch}`);
  }
  if (e.infra_depth === 'heavy') {
    ceiling = Math.min(ceiling, P.scoreCeilings.heavyInfra); raw -= P.penalties.infraMismatch;
    log.push(`heavy_infra:${P.scoreCeilings.heavyInfra},-${P.penalties.infraMismatch}`);
  }
  const d = e.direct_match_signals.length;
  if (d === 0) {
    ceiling = Math.min(ceiling, P.scoreCeilings.adjacentStackOnly); raw -= P.penalties.vagueStackEvidence;
    log.push(`adjacent_only:${P.scoreCeilings.adjacentStackOnly},-${P.penalties.vagueStackEvidence}`);
  } else if (d < P.scoreCeilings.minDirectMatchesForFull) {
    ceiling = Math.min(ceiling, P.scoreCeilings.fewDirectMatches);
    log.push(`few_direct:${P.scoreCeilings.fewDirectMatches}(${d})`);
  }
  if (e.onsite_required && !isUSRole(e)) {
    raw -= P.penalties.hybridOnsiteFriction;
    log.push(`hybrid_friction:-${P.penalties.hybridOnsiteFriction}`);
  }
  return { score: Math.max(0, Math.min(raw, ceiling)), log };
}

function hasMajorStretch(e: JobExtraction): boolean {
  return e.seniority_level === 'senior' || e.seniority_level === 'lead_plus' || e.infra_depth === 'heavy' || e.management_expectation;
}

async function main() {
  const e = await extractJob(DESCRIPTION, { remote: false });

  const blockers: string[] = [];
  if (e.visa_restriction === 'us_only') blockers.push('US-only');
  if (e.visa_restriction === 'eu_only')  blockers.push('EU-only');
  if (e.tech_mismatch_level === 'major') blockers.push('Core stack fundamentally outside profile');
  if (e.role_category === 'reject')      blockers.push('Non-target role');

  const { score, log } = computeScore(e);
  const isIneligible = blockers.length > 0;
  const rec = isIneligible ? 'ineligible'
    : score >= 86 && !hasMajorStretch(e) ? 'strong_match'
    : score >= 72 ? 'possible_match'
    : 'weak_match';

  console.log('\n.NET / C# / Blazor REGRESSION TEST');
  console.log('='.repeat(60));
  console.log(`raw_score:            ${e.raw_score}`);
  console.log(`final_score:          ${score}`);
  console.log(`score_log:            ${log.join(' | ')}`);
  console.log(`role_category:        ${e.role_category}`);
  console.log(`seniority_level:      ${e.seniority_level}`);
  console.log(`infra_depth:          ${e.infra_depth}`);
  console.log(`tech_mismatch_level:  ${e.tech_mismatch_level}`);
  console.log(`direct_matches:       [${e.direct_match_signals.join(', ')}]`);
  console.log(`adjacent_matches:     [${e.adjacent_match_signals.join(', ')}]`);
  console.log(`stretch_signals:      [${e.stretch_signals.join(', ')}]`);
  console.log(`onsite_required:      ${e.onsite_required}`);
  console.log('');
  console.log('reasons_for:');
  e.reasons_for.forEach(r => console.log('  + ' + r));
  console.log('reasons_against:');
  e.reasons_against.forEach(f => console.log('  ! ' + f));
  if (blockers.length) console.log('blockers: ' + blockers.join('; '));
  console.log('');
  console.log(`=> recommendation: ${rec}`);
  console.log('');

  const scoreOk        = score <= 60;
  const recOk          = rec === 'weak_match' || rec === 'ineligible';
  const mentionsDotNet = e.reasons_against.some(f => /\.net|c#/i.test(f));
  const mentionsBlazor = e.reasons_against.some(f => /blazor/i.test(f));

  console.log('ASSERTIONS:');
  console.log(`  score <= 60:              ${scoreOk        ? '✓ PASS' : `✗ FAIL (got ${score})`}`);
  console.log(`  rec is weak/ineligible:   ${recOk          ? '✓ PASS' : `✗ FAIL (got ${rec})`}`);
  console.log(`  reasons_against .NET/C#:  ${mentionsDotNet ? '✓ PASS' : '✗ FAIL (not mentioned)'}`);
  console.log(`  reasons_against Blazor:   ${mentionsBlazor ? '✓ PASS' : '✗ FAIL (not mentioned)'}`);
  const allPass = scoreOk && recOk && mentionsDotNet && mentionsBlazor;
  console.log('');
  console.log(allPass ? '✓ ALL ASSERTIONS PASSED' : '✗ SOME ASSERTIONS FAILED');
}
main();
