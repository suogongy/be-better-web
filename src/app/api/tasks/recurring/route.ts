import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RecurringTaskService } from '@/lib/supabase/services/recurring-task.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const recurringTaskService = new RecurringTaskService(supabase);

// GET /api/tasks/recurring/instances/[taskId] - 获取任务的重复实例
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instances = await recurringTaskService.getTaskInstances(params.taskId);
    
    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error fetching task instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task instances' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/recurring/generate - 手动生成重复任务实例
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, endDate, maxInstances } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const instances = await recurringTaskService.generateRecurringInstances(
      taskId,
      new Date(endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxInstances || 30
    );

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error generating recurring instances:', error);
    return NextResponse.json(
      { error: 'Failed to generate recurring instances' },
      { status: 500 }
    );
  }
}