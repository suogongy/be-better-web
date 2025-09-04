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
  try {
    import('openai').then((module) => {
      const OpenAI = module.default;
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }).catch((error) => {
      console.warn('OpenAI package not installed. AI features will be disabled.');
    });
  } catch (error) {
    console.warn('OpenAI package not installed. AI features will be disabled.');
  }
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
    const { summaryId, options } = body;
    
    const result = await blogService.generateBlogFromSummary(summaryId, options);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('博客生成错误:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog' }, 
      { status: 500 }
    );
  }
}

// GET /api/blog/generate/preview - 预览博客
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summaryId = searchParams.get('summaryId');
    const templateId = searchParams.get('templateId');

    if (!summaryId) {
      return NextResponse.json({ error: 'Summary ID is required' }, { status: 400 });
    }

    // @ts-ignore
    const preview = await blogService.generateBlogFromSummary(summaryId, { templateId });
    
    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('博客预览错误:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' }, 
      { status: 500 }
    );
  }
}