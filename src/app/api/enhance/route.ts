import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    console.log('API enhance called');
    
    const secret = process.env.TASK_ENHANCE_SECRET;
    console.log('Secret exists:', !!secret);
    
    const header = req.headers.get('x-enhance-secret') || req.headers.get('authorization');
    console.log('Header received:', header);
    
    const isAuthorized = secret && (header === secret || header === `Bearer ${secret}`);
    if (!isAuthorized) {
      console.log('Authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch((e) => {
      console.log('JSON parse error:', e);
      return null;
    });
    
    console.log('Body received:', body);
    
    if (!body || !body.taskId || typeof body.enhancedTitle !== 'string') {
      console.log('Invalid payload:', { body, taskId: body?.taskId, enhancedTitle: body?.enhancedTitle });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('Updating task:', body.taskId, 'with enhanced title:', body.enhancedTitle);

    const { error } = await supabase
      .from('tasks')
      .update({ enhanced_title: body.enhancedTitle })
      .eq('id', body.taskId);

    if (error) {
      console.log('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Task updated successfully');
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.log('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


