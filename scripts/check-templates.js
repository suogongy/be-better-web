const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
  try {
    console.log('🔍 检查数据库连接...');
    
    // 检查task_templates表是否存在
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'task_templates');
    
    if (tablesError) {
      console.error('❌ 查询表信息失败:', tablesError);
      return;
    }
    
    if (tables.length === 0) {
      console.log('❌ task_templates表不存在');
      console.log('请运行 scripts/schedule-system-update.sql 来创建表');
      return;
    }
    
    console.log('✅ task_templates表存在');
    
    // 检查表中的数据
    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*')
      .limit(5);
    
    if (templatesError) {
      console.error('❌ 查询模板数据失败:', templatesError);
      return;
    }
    
    console.log(`✅ 找到 ${templates.length} 个模板`);
    
    if (templates.length > 0) {
      console.log('\n📋 模板列表:');
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name} (${template.category})`);
        console.log(`   描述: ${template.description || '无'}`);
        console.log(`   系统模板: ${template.is_system ? '是' : '否'}`);
        console.log(`   任务数量: ${template.task_data?.tasks?.length || 0}`);
        console.log('');
      });
    } else {
      console.log('⚠️ 表中没有模板数据');
      console.log('请运行 scripts/schedule-system-update.sql 来插入示例数据');
    }
    
    // 检查tasks表
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    if (tasksError) {
      console.error('❌ 查询tasks表失败:', tasksError);
    } else {
      console.log('✅ tasks表正常');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

checkTemplates().then(() => {
  console.log('\n✅ 检查完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});
