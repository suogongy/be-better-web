import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BlogGenerationService } from '@/lib/supabase/services/blog-generation.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const blogService = new BlogGenerationService(supabase);

// POST /api/blog/preview - 预览博客生成
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summaryId, templateId } = body;

    if (!summaryId || !templateId) {
      return NextResponse.json(
        { error: 'Summary ID and Template ID are required' },
        { status: 400 }
      );
    }

    // 验证总结属于当前用户
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('user_id')
      .eq('id', summaryId)
      .single();

    if (!summary || summary.user_id !== user.id) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    const preview = await blogService.previewBlogGeneration(summaryId, templateId);

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('Error previewing blog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview blog' },
      { status: 500 }
    );
  }
}