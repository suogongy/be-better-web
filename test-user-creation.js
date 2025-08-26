#!/usr/bin/env node

/**
 * 用户注册和资料创建测试脚本
 * 用于验证注册流程是否正确创建了 public.users 表中的用户资料
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 读取 .env.local 文件
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  const envVars = {}
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    }
  } catch (error) {
    console.log('⚠️  未找到 .env.local 文件，使用系统环境变量')
  }
  
  return envVars
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 配置未找到，请检查 .env.local 文件')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreation() {
  console.log('🧪 开始测试用户注册和资料创建...\n')

  try {
    // 检查当前认证状态
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ 获取会话失败:', sessionError.message)
      return
    }

    if (session?.user) {
      console.log('✅ 当前已登录用户:', session.user.email)
      console.log('🔍 正在检查 public.users 表中的用户资料...\n')

      // 检查 public.users 表中是否存在该用户
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('❌ 在 public.users 表中未找到用户资料')
          console.log('💡 这意味着用户注册时没有自动创建资料')
          console.log('🔧 建议重新注册或手动创建用户资料')
        } else {
          console.error('❌ 查询用户资料时出错:', profileError.message)
        }
        return
      }

      if (userProfile) {
        console.log('✅ 在 public.users 表中找到用户资料:')
        console.log('   ID:', userProfile.id)
        console.log('   邮箱:', userProfile.email)
        console.log('   姓名:', userProfile.name || '未设置')
        console.log('   创建时间:', userProfile.created_at)
        console.log('   更新时间:', userProfile.updated_at)
        console.log('\n✅ 用户注册和资料创建功能正常工作！')
      }
    } else {
      console.log('ℹ️  当前未登录')
      console.log('💡 请先注册一个账号来测试用户资料创建功能')
    }

    // 检查表结构
    console.log('\n🔍 检查 public.users 表结构...')
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .limit(5)

    if (listError) {
      console.error('❌ 查询用户表失败:', listError.message)
      return
    }

    console.log(`📊 public.users 表中共有 ${allUsers.length} 个用户记录`)
    if (allUsers.length > 0) {
      console.log('最近的用户记录:')
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || '未设置姓名'})`)
      })
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
  }
}

async function checkAuthUsers() {
  console.log('\n🔍 检查 auth.users 表...')
  
  try {
    // 注意：直接访问 auth.users 需要管理员权限，这里我们使用当前用户信息
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️  无法获取认证用户信息（可能未登录）')
      return
    }

    if (user) {
      console.log('✅ auth.users 中的用户信息:')
      console.log('   ID:', user.id)
      console.log('   邮箱:', user.email)
      console.log('   邮箱已验证:', user.email_confirmed_at ? '是' : '否')
      console.log('   创建时间:', user.created_at)
      console.log('   用户元数据:', JSON.stringify(user.user_metadata, null, 2))
    }
  } catch (error) {
    console.log('ℹ️  无法检查 auth.users:', error.message)
  }
}

// 运行测试
testUserCreation()
  .then(() => checkAuthUsers())
  .then(() => {
    console.log('\n📋 测试完成！')
    console.log('\n💡 如果发现问题，请尝试以下解决方案:')
    console.log('   1. 重新注册一个新账号')
    console.log('   2. 检查 Supabase 配置是否正确')
    console.log('   3. 确认数据库表已正确创建')
    console.log('   4. 检查 RLS 策略是否阻止了数据访问')
  })
  .catch(console.error)