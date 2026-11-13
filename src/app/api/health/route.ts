import { NextResponse } from 'next/server';
import { getPublicEnv } from '@/lib/env';

export async function GET() {
  const { isSupabaseConfigured } = getPublicEnv();
  return NextResponse.json({
    status: 'ok',
    service: 'cozy-lab',
    databaseConfigured: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  });
}
