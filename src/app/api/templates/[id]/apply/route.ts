import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/supabase/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/templates/[id]/apply - 应用任务模板
export async function POST(
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
    const body = await request.json();
    const { startDate, preserveDependencies = true, customizations = {} } = body;

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

    // 计算开始日期
    const startDateTime = startDate ? new Date(startDate) : new Date();
    const createdTasks = [];

    // 为每个模板任务创建实际任务
    for (let i = 0; i < templateTasks.length; i++) {
      const templateTask = templateTasks[i];
      
      // 计算任务的截止日期（基于开始日期和任务顺序）
      const dueDate = new Date(startDateTime);
      dueDate.setDate(dueDate.getDate() + i); // 每天一个任务
      
      // 应用自定义设置
      const taskData = {
        title: templateTask.title,
        description: templateTask.description || '',
        category: templateTask.category || 'general',
        priority: templateTask.priority || 'medium',
        estimated_minutes: templateTask.estimated_minutes || 30,
        due_date: dueDate.toISOString(),
        status: 'pending',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...customizations // 允许覆盖默认值
      };

      // 创建任务
      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating task:', createError);
        continue; // 继续创建其他任务
      }

      createdTasks.push(newTask);
    }

    // 更新模板使用次数
    await supabase
      .from('task_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    return NextResponse.json({
      message: 'Template applied successfully',
      tasks: createdTasks,
      template: {
        id: template.id,
        name: template.name,
        applied_tasks_count: createdTasks.length
      }
    });

  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}
