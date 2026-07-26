import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from('projects').select('id').limit(1);

    if (error) {
      console.error('[keep-alive]', error);
      return NextResponse.json(
        { ok: false, error: error.message, at: new Date().toISOString() },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    console.error('[keep-alive]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error', at: new Date().toISOString() },
      { status: 503 },
    );
  }
}
