/**
 * Calendar Sync Cron Job
 * Automatically syncs all calendar connections
 * Can be triggered by Vercel Cron or external scheduler
 */

import { NextResponse } from 'next/server';
import { syncAllCalendars } from '@/lib/calendar/sync';

// Secret key for cron job authentication (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  // Check for cron secret if configured
  const authHeader = request.headers.get('authorization');
  const searchParams = request.nextUrl.searchParams;
  const secretParam = searchParams.get('secret');

  // Allow authentication via header or query param
  const providedSecret = authHeader?.replace('Bearer ', '') || secretParam;

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await syncAllCalendars({
      forceFullSync: false, // Use incremental sync for scheduled jobs
    });

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      results: result.results.map((r) => ({
        connectionId: r.connectionId,
        provider: r.provider,
        success: r.success,
        stats: r.stats,
        error: r.error?.message,
      })),
      errors: result.error ? [result.error.message] : undefined,
    });
  } catch (error) {
    console.error('Calendar cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request) {
  return GET(request);
}
