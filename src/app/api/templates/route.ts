import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TaskTemplateService } from '@/lib/supabase/services/task-template.service';
import { getUserFromRequest } from '@/lib/supabase/auth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const taskTemplateService = new TaskTemplateService(supabase);

// GET /api/templates - 获取任务模板
export async function GET(request: NextRequest) {
  try {
    // 使用新的认证工具从请求头获取用户信息
    const { user, error: authError } = await getUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type'); // 'user', 'system', 'all'

    let templates;
    if (type === 'system') {
      templates = await taskTemplateService.getSystemTemplates();
    } else {
      templates = await taskTemplateService.getTemplates(user.id, category || undefined);
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - 创建任务模板
export async function POST(request: NextRequest) {
  try {
    // 使用新的认证工具从请求头获取用户信息
    const { user, error: authError } = await getUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, tasks, is_shared } = body;

    if (!name || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Name and tasks are required' },
        { status: 400 }
      );
    }

    const template = await taskTemplateService.createTemplate(user.id, {
      name,
      description,
      category: category || 'general',
      tasks,
      is_shared: is_shared || false,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}