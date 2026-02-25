import { NextResponse } from 'next/server';
import { getJobsRawCount } from '@/lib/db';

export async function GET() {
  const count = await getJobsRawCount();
  return NextResponse.json({ count });
}
