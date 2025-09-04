import { createClient } from '../src/lib/supabase/client.ts'

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接和当前状态...')
  
  try {
    const supabase = createClient()
    
    // 测试基本连接
    console.log('1. 测试基本连接...')
    const { data, error } = await supabase.from('posts').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ 数据库连接失败:', error.message)
      return false
    }
    
    console.log(`✅ 数据库连接成功，当前有 ${data?.[0]?.count || 0} 篇文章`)
    
    // 检查 posts 表结构
    console.log('\n2. 检查 posts 表结构...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'posts')
    
    if (columnsError) {
      console.error('❌ 无法获取表结构:', columnsError.message)
    } else {
      console.log('📋 Posts 表列:')
      columns?.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // 检查是否有新字段
    const hasCategoryIds = columns?.some(col => col.column_name === 'category_ids')
    const hasTagIds = columns?.some(col => col.column_name === 'tag_ids')
    const hasUserId = columns?.some(col => col.column_name === 'user_id')
    
    console.log('\n3. 迁移状态检查:')
    console.log(`   - category_ids 字段: ${hasCategoryIds ? '✅ 已存在' : '❌ 不存在'}`)
    console.log(`   - tag_ids 字段: ${hasTagIds ? '✅ 已存在' : '❌ 不存在'}`)
    console.log(`   - user_id 字段: ${hasUserId ? '⚠️  存在（需要移除）' : '✅ 已移除'}`)
    
    // 测试新查询方法
    console.log('\n4. 测试新查询方法...')
    
    // 尝试使用数组字段查询
    let testQuery = supabase.from('posts').select('*', { count: 'exact' })
    
    if (hasCategoryIds) {
      console.log('   - 测试 category_ids 查询...')
      const { data: testData, error: testError } = await testQuery
        .contains('category_ids', [])
        .limit(1)
      
      if (testError) {
        console.log('   ⚠️  category_ids 查询可能需要优化:', testError.message)
      } else {
        console.log('   ✅ category_ids 查询正常')
      }
    }
    
    // 测试旧查询方法
    console.log('\n5. 测试兼容性...')
    const { data: oldTestData, error: oldTestError } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories(
          categories(id, name, color)
        ),
        post_tags(
          tags(id, name)
        )
      `)
      .limit(1)
    
    if (oldTestError) {
      console.log('   ❌ 旧查询方法失败:', oldTestError.message)
    } else {
      console.log('   ✅ 旧查询方法正常，保持向后兼容')
    }
    
    // 检查分类和标签数据
    console.log('\n6. 检查分类和标签数据...')
    const { data: categories } = await supabase.from('categories').select('count', { count: 'exact', head: true })
    const { data: tags } = await supabase.from('tags').select('count', { count: 'exact', head: true })
    
    console.log(`   - 分类数量: ${categories?.[0]?.count || 0}`)
    console.log(`   - 标签数量: ${tags?.[0]?.count || 0}`)
    
    console.log('\n🎉 数据库测试完成!')
    return true
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    return false
  }
}

// 运行测试
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ 所有测试通过')
      process.exit(0)
    } else {
      console.log('\n❌ 测试失败')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ 未预期的错误:', error)
    process.exit(1)
  })