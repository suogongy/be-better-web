# 用户注册问题解决方案

## 问题描述

在使用邮箱注册账号后，Supabase 的 `auth.users` 表中有数据，但是 `public.users` 表为空。这是因为用户注册后没有自动在 `public.users` 表中创建对应的用户资料。

## 问题原因

1. **触发器被移除**: 项目之前移除了所有数据库触发器，包括自动创建用户资料的触发器
2. **认证逻辑不完整**: 原有的认证系统只处理 Supabase 身份验证，没有在应用层创建用户资料
3. **数据同步缺失**: `auth.users`（Supabase 内置认证表）和 `public.users`（应用业务表）之间缺乏同步机制

## 解决方案

### 1. 更新导入引用

我们更新了多个文件中的导入引用，将用户服务导入路径从旧路径更新到新路径。

#### 更新认证上下文 (auth-context.tsx)

在 `src/lib/auth/auth-context.tsx` 中：

```typescript
// 修复前
// import { userService } from '@/lib/supabase/database'

// 修复后
import { userService } from '@/lib/supabase/services/index'
```

#### 添加用户资料创建函数
```typescript
const ensureUserProfile = async (user: User) => {
  try {
    await userService.createUserFromAuth(user)
  } catch (error) {
    console.warn('Failed to create user profile:', error)
  }
}
```

#### 在认证状态变化时自动创建用户资料
```typescript
supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await ensureUserProfile(session.user)
  }
  setUser(session?.user ?? null)
  setLoading(false)
})
```

#### 支持用户元数据传递
```typescript
const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { error }
}
```

### 2. 更新注册页面

在 `src/app/auth/register/page.tsx` 中：

#### 传递用户姓名
```typescript
const { error } = await signUp(data.email, data.password, { name: data.name })
```

这样注册时会将用户填写的姓名作为元数据传递给 Supabase。

### 3. 数据库服务 (database.ts)

已有的 `userService.createUserFromAuth()` 函数处理从认证信息创建用户资料：

```typescript
async createUserFromAuth(authUser: any): Promise<User> {
  const userData = {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(userData)
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to create user profile from auth', error)
  }

  return data
}
```

## 修复验证

### 测试脚本
我们创建了一个测试脚本 `test-user-creation.js` 来验证修复效果：

1. 检查当前登录用户的资料是否存在于 `public.users` 表
2. 显示 `public.users` 表中的用户数量和记录
3. 提供故障排除建议

### 运行测试
```bash
node test-user-creation.js
```

## 工作流程

现在的用户注册流程如下：

1. **用户填写注册表单** → 包含姓名、邮箱、密码
2. **调用 signUp 函数** → 传递用户信息和元数据到 Supabase
3. **Supabase 创建认证用户** → 在 `auth.users` 表中创建记录
4. **触发认证状态变化** → `onAuthStateChange` 监听器被调用
5. **自动创建用户资料** → `ensureUserProfile` 函数被执行
6. **调用用户服务** → `userService.createUserFromAuth` 创建 `public.users` 记录

## 优点

1. **应用层控制**: 所有业务逻辑在应用代码中，便于调试和修改
2. **错误处理**: 包含适当的错误处理，用户资料创建失败不会影响认证
3. **数据一致性**: 确保每个认证用户都有对应的业务资料
4. **元数据支持**: 支持从注册表单传递额外信息（如姓名）

## 测试建议

1. **注册新用户**: 使用新的邮箱地址注册账号
2. **检查数据库**: 验证 `public.users` 表中是否创建了对应记录
3. **登录测试**: 已有用户登录时也会触发资料检查和创建
4. **运行测试脚本**: 使用 `node test-user-creation.js` 验证数据状态
5. **检查导入**: 验证所有相关文件的导入路径是否正确

## 故障排除

如果遇到问题：

1. **检查网络连接**: 确保可以访问 Supabase
2. **验证环境配置**: 检查 `.env.local` 中的 Supabase 配置
3. **检查 RLS 策略**: 确保 Row Level Security 策略允许插入数据
4. **查看浏览器控制台**: 检查是否有 JavaScript 错误
5. **验证导入路径**: 确保所有文件的导入路径正确无误
6. **重新登录测试**: 已有用户可以重新登录触发资料创建

现在用户注册后，`auth.users` 和 `public.users` 表应该都会包含用户数据！