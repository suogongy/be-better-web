import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BlogGenerationService } from '@/lib/supabase/services/blog-generation.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const blogService = new BlogGenerationService(supabase);

// GET /api/blog/templates - 获取博客模板
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const templates = await blogService.getBlogTemplates(user.id, type || undefined);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching blog templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog templates' },
      { status: 500 }
    );
  }
}

// POST /api/blog/templates - 创建博客模板
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, template_content, variables, is_default } = body;

    if (!name || !type || !template_content) {
      return NextResponse.json(
        { error: 'Name, type, and template content are required' },
        { status: 400 }
      );
    }

    const template = await blogService.createBlogTemplate(user.id, {
      name,
      description,
      type,
      template_content,
      variables,
      is_default,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating blog template:', error);
    return NextResponse.json(
      { error: 'Failed to create blog template' },
      { status: 500 }
    );
  }
}