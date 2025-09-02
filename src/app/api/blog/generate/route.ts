import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BlogGenerationService } from '@/lib/supabase/services/blog-generation.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 初始化OpenAI（可选）
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  // 动态导入以避免未使用时的错误
  import('openai').then(OpenAI => {
    openai = new OpenAI.default({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }).catch(() => {
    console.warn('OpenAI package not installed. AI features will be disabled.');
  });
}

const blogService = new BlogGenerationService(supabase, openai);

// POST /api/blog/generate - 从日程生成博客
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summaryId, templateId, includeTasks, includeStats, includeInsights, autoPublish } = body;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
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

    const post = await blogService.generateBlogFromSummary(summaryId, {
      templateId,
      includeTasks,
      includeStats,
      includeInsights,
      autoPublish,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error generating blog:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog' },
      { status: 500 }
    );
  }
}