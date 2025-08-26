# 环境变量配置指南

## 问题解决

如果您遇到"加载中"一直显示的问题，通常是因为 Supabase 配置未正确设置。

## 配置步骤

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# Windows
copy .env.local.example .env.local

# macOS/Linux
cp .env.local.example .env.local
```

### 2. 获取 Supabase 配置

1. 登录 [Supabase](https://supabase.com)
2. 创建新项目或选择现有项目
3. 进入项目设置 → API
4. 复制以下信息：

### 3. 配置环境变量

编辑 `.env.local` 文件，填入您的配置：

```env
# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 匿名密钥
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 可选：服务角色密钥（用于管理员操作）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. 重启开发服务器

```bash
npm run dev
```

## 验证配置

配置完成后，您应该能够：

1. 正常访问首页，不再显示"加载中"
2. 注册和登录用户
3. 访问需要认证的页面

## 连接超时问题解决方案

如果您遇到"连接超时"错误，请按以下步骤排查：

### 1. 使用诊断工具

访问 `/debug` 页面进行系统诊断：
- 检查环境变量配置
- 测试网络连接
- 验证 Supabase 连接
- 检查数据库访问权限

### 2. 检查 Supabase 项目状态

1. 访问 [Supabase 控制台](https://supabase.com/dashboard)
2. 确认项目状态为"Active"
3. 检查项目是否在维护中或暂停

### 3. 网络连接问题

- **防火墙设置**：确保允许访问 `*.supabase.co`
- **代理设置**：如果在公司网络，可能需要配置代理
- **DNS 问题**：尝试使用公共 DNS（如 8.8.8.8）

### 4. 环境变量检查

确保 `.env.local` 文件：
- 在项目根目录（与 `package.json` 同级）
- 没有多余的空格或引号
- 变量名正确（注意 `NEXT_PUBLIC_` 前缀）

### 5. 浏览器缓存

- 清除浏览器缓存和 Cookie
- 尝试无痕模式访问
- 检查浏览器控制台错误信息

### 6. 开发服务器重启

```bash
# 停止开发服务器
Ctrl+C

# 清除 Next.js 缓存
rm -rf .next

# 重新启动
npm run dev
```

## 常见问题

### Q: 仍然显示"加载中"
A: 检查环境变量是否正确设置，确保没有多余的空格或引号

### Q: 认证服务连接超时
A: 
1. 使用 `/debug` 页面进行诊断
2. 检查 Supabase 项目状态
3. 确认网络连接正常
4. 尝试重启开发服务器

### Q: 配置错误
A: 确保环境变量名称正确，特别是 `NEXT_PUBLIC_` 前缀

### Q: 可以访问 Supabase 控制台但应用连接失败
A: 
1. 检查项目的 API 密钥是否正确
2. 确认项目区域设置
3. 检查 RLS（行级安全）策略
4. 验证数据库表结构

## 获取帮助

如果问题仍然存在，请检查：

1. 浏览器控制台是否有错误信息
2. Supabase 项目是否正常运行
3. 网络连接是否正常
4. 使用 `/debug` 页面获取详细诊断信息

## 联系支持

如果以上步骤都无法解决问题：

1. 收集诊断页面的结果
2. 截图浏览器控制台错误
3. 提供 Supabase 项目 ID
4. 联系技术支持
