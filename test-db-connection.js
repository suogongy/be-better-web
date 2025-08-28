// 测试数据库连接和数据查询
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少环境变量配置');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('开始测试数据库连接...');
    
    // 测试获取文章
    console.log('测试获取特定文章: 0d0d53c8-d94d-45a6-b11e-4d0671d88dd0');
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', '0d0d53c8-d94d-45a6-b11e-4d0671d88dd0')
      .single();
    
    if (postError) {
      console.error('获取文章失败:', postError);
    } else {
      console.log('文章数据:', postData);
      console.log('文章用户ID:', postData.user_id);
      console.log('文章状态:', postData.status);
    }
    
    // 测试获取用户
    console.log('测试获取用户: 5bb3e42a-97f9-4e59-a413-accc0bc953dc');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '5bb3e42a-97f9-4e59-a413-accc0bc953dc')
      .single();
    
    if (userError) {
      console.error('获取用户失败:', userError);
    } else {
      console.log('用户数据:', userData);
    }
    
    // 测试获取所有已发布文章
    console.log('测试获取所有已发布文章:');
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .limit(5);
    
    if (allPostsError) {
      console.error('获取文章列表失败:', allPostsError);
    } else {
      console.log(`找到 ${allPosts.length} 篇已发布文章`);
      allPosts.forEach(post => {
        console.log(`- ${post.id}: ${post.title} (user: ${post.user_id}, status: ${post.status})`);
      });
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testConnection();