import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  const secret = process.env.TASK_ENHANCE_SECRET;
  const header = req.headers.get('x-enhance-secret') || req.headers.get('authorization');
  const isAuthorized = secret && (header === secret || header === `Bearer ${secret}`);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.taskId || typeof body.enhancedTitle !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await supabase
    .from('tasks')
    .update({ enhanced_title: body.enhancedTitle })
    .eq('id', body.taskId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


