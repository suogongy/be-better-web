import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/supabase/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/templates/[id]/preview - 预览任务模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const { user, error: authError } = await getUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const templateId = id;
    const { searchParams } = new URL(request.url);
    const previewDate = searchParams.get('date');

    if (!previewDate) {
      return NextResponse.json(
        { error: 'Preview date is required' },
        { status: 400 }
      );
    }

    // 获取模板信息
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // 检查模板是否属于当前用户或者是系统模板
    if (!template.is_system && template.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 解析模板中的任务数据
    const templateTasks = template.task_data?.tasks || [];
    if (templateTasks.length === 0) {
      return NextResponse.json(
        { error: 'Template has no tasks' },
        { status: 400 }
      );
    }

    // 计算预览日期
    const startDateTime = new Date(previewDate);
    const previewTasks = [];

    // 为每个模板任务创建预览任务
    for (let i = 0; i < templateTasks.length; i++) {
      const templateTask = templateTasks[i];
      
      // 计算任务的截止日期（基于开始日期和任务顺序）
      const dueDate = new Date(startDateTime);
      dueDate.setDate(dueDate.getDate() + i); // 每天一个任务
      
      // 创建预览任务（不保存到数据库）
      const previewTask = {
        title: templateTask.title,
        description: templateTask.description || '',
        category: templateTask.category || 'general',
        priority: templateTask.priority || 'medium',
        estimated_minutes: templateTask.estimated_minutes || 30,
        due_date: dueDate.toISOString(),
        status: 'pending',
        is_preview: true
      };

      previewTasks.push(previewTask);
    }

    return NextResponse.json({
      message: 'Template preview generated successfully',
      previewTasks,
      template: {
        id: template.id,
        name: template.name,
        task_count: templateTasks.length
      }
    });

  } catch (error) {
    console.error('Error previewing template:', error);
    return NextResponse.json(
      { error: 'Failed to preview template' },
      { status: 500 }
    );
  }
}
