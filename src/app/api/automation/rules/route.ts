import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AutomationService } from '@/lib/supabase/services/automation.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const automationService = new AutomationService(supabase);

// GET /api/automation/rules - 获取自动化规则
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await automationService.getRules(user.id);
    
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST /api/automation/rules - 创建自动化规则
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger_type, trigger_config, action_type, action_config } = body;

    if (!name || !trigger_type || !trigger_config || !action_type || !action_config) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const rule = await automationService.createRule(user.id, {
      name,
      description,
      trigger_type,
      trigger_config,
      action_type,
      action_config,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}