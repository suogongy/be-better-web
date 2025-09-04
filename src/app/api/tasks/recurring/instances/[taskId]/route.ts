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
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;
    const instances = await recurringTaskService.getTaskInstances(taskId);
    
    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error fetching task instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task instances' },
      { status: 500 }
    );
  }
}