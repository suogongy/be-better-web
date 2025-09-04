import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TaskTemplateService } from '@/lib/supabase/services/task-template.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const taskTemplateService = new TaskTemplateService(supabase);

// POST /api/templates/[id]/apply - 应用任务模板
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, offsetDays, adjustTimes, preserveDependencies, customizations } = body;

    const { id } = await params;
    const tasks = await taskTemplateService.applyTemplate(user.id, id, {
      startDate: startDate ? new Date(startDate) : undefined,
      offsetDays,
      adjustTimes,
      preserveDependencies,
      customizations,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}

// GET /api/templates/[id]/preview - 预览模板应用
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const previewDate = searchParams.get('date') || new Date().toISOString();

    const { id } = await params;
    const previewTasks = await taskTemplateService.previewTemplate(
      user.id,
      id,
      new Date(previewDate)
    );

    return NextResponse.json({ previewTasks });
  } catch (error) {
    console.error('Error previewing template:', error);
    return NextResponse.json(
      { error: 'Failed to preview template' },
      { status: 500 }
    );
  }
}