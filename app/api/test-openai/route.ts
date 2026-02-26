import { NextResponse } from 'next/server';
import { scoreJob } from '@/lib/openai';

const DUMMY_DESCRIPTION = `
We are looking for a Software Engineer to join our SaaS platform team.
You will build and maintain REST API integrations between our onboarding platform and third-party services.
The role is fully remote. TypeScript and Supabase experience preferred.
3+ years of experience required.
`;

export async function GET() {
  try {
    const result = await scoreJob(DUMMY_DESCRIPTION);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
