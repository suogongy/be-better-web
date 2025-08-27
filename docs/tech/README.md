# 技术文档

此目录包含个人网站项目的综合文档，该项目结合了博客管理和日常日程规划功能。

## 📋 文档概述

### [需求文档](./requirements.md)
详细的功能和非功能需求，包括：
- **博客管理系统**：内容创建、组织和读者互动
- **日程管理系统**：日常规划、进度跟踪和分析
- **集成功能**：从日程摘要自动生成博客文章
- **用户体验功能**：公开访问、响应式设计和管理功能
- **额外推荐功能**：内容增强、生产力工具和社会功能

### [技术设计文档](./technical-design.md)
全面的技术架构和实现细节：
- **技术栈**：Next.js 15.5.0、React 19.1.0、TypeScript、Tailwind CSS v4、Supabase
- **数据库模式**：完整的PostgreSQL模式，包括关系和索引
- **API设计**：用于认证、博客和日程管理的RESTful端点
- **组件架构**：模块化的React组件结构
- **安全考虑**：行级安全、输入验证和内容保护

### [开发路线图](./development-roadmap.md)
带时间表的逐步实施计划：
- **阶段1**：基础设置（第1-2周）
- **阶段2**：博客管理系统（第3-4周）
- **阶段3**：日程管理系统（第5-6周）
- **阶段4**：集成和高级功能（第7-8周）
- **阶段5**：优化和部署（第9-10周）

## 🚀 快速开始

1. **查看需求**：从 `requirements.md` 开始了解项目范围
2. **研究技术设计**：阅读 `technical-design.md` 了解实现细节
3. **遵循开发计划**：使用 `development-roadmap.md` 进行逐步开发

## 🏗️ 项目架构

```
个人网站
├── 博客管理
│   ├── 内容创建与编辑
│   ├── 分类与标签
│   ├── 评论系统
│   └── SEO优化
├── 日程管理
│   ├── 日常任务规划
│   ├── 进度跟踪
│   ├── 分析与摘要
│   └── 习惯跟踪
└── 集成功能
    ├── 自动博客生成
    ├── 数据导出
    └── 生产力洞察
```

## 🛠️ 技术栈

- **前端**：Next.js 15.5.0 + React 19.1.0 + TypeScript + Tailwind CSS v4
- **后端**：Supabase（PostgreSQL + Auth + Storage + Edge Functions）
- **开发**：ESLint + Turbopack + PostCSS
- **附加**：TipTap（富文本）、React Hook Form、Zod、Framer Motion

## 📊 主要功能

### 博客管理
- ✅ 支持Markdown的富文本编辑器
- ✅ 分类和标签组织
- ✅ 带审核的评论系统
- ✅ SEO优化和社会分享
- ✅ 无需认证的访客访问

### 日程管理
- ✅ 带优先级的日常待办清单
- ✅ 进度跟踪和时间记录
- ✅ 日常摘要和分析
- ✅ 重复任务和习惯跟踪
- ✅ 生产力洞察和指标

### 集成
- ✅ 从日常摘要自动生成博客文章
- ✅ 日程博客的可定制模板
- ✅ 多格式数据导出
- ✅ 跨平台日历集成

## 🔒 安全与性能

- **认证**：带JWT令牌的Supabase Auth
- **授权**：行级安全（RLS）策略
- **性能**：Next.js的SSG/SSR，优化查询
- **SEO**：元标签、结构化数据、XML站点地图
- **可访问性**：WCAG 2.1 AA合规

## 📅 开发时间表

| 阶段 | 时长 | 重点 |
|------|------|------|
| 基础 | 2周 | 设置、认证、UI组件 |
| 博客系统 | 2周 | 内容管理、公共页面 |
| 日程系统 | 2周 | 任务管理、分析 |
| 集成 | 2周 | 自动博客、高级功能 |
| 完善与部署 | 2周 | 测试、优化、发布 |

## 🎯 成功标准

- **功能**：所有核心功能已实现并测试
- **性能**：页面加载<3秒，Lighthouse分数>90
- **安全**：零严重漏洞，安全的认证
- **UX**：直观的界面，移动端响应式
- **部署**：成功生产部署

## 📝 备注

- 此项目设计为**简单却全面**
- 专注于**核心功能**而非复杂特性
- 强调**用户体验**和**性能**
- 为**可扩展性**和**可维护性**而构建
- 为**个人使用**优化，但可扩展为协作

## 🔄 未来增强功能

- AI驱动的内容建议
- 家庭/团队协作功能
- 移动应用开发
- 高级分析和洞察
- 插件系统以实现扩展性

## 🚀 Vercel 部署指南

### 1. 准备工作

在部署到Vercel之前，请确保：

#### 1.1 Supabase 项目设置
```bash
# 1. 创建Supabase项目
# 访问 https://supabase.com 创建新项目

# 2. 获取项目配置
# 在Supabase仪表板中：
# - 进入 Settings > API
# - 复制 URL 和 anon/public key
# - 进入 Settings > Database
# - 复制 connection string 或创建新的密码
```

#### 1.2 环境变量配置
在项目根目录创建 `.env.local` 文件：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth 配置（如果使用）
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# 其他配置
NODE_ENV=production
```

#### 1.3 数据库设置
```sql
-- 在Supabase SQL编辑器中运行以下命令：

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 创建表结构
-- 复制 database-setup.sql 中的内容并执行

-- 3. 设置行级安全策略
-- 确保所有表都启用了RLS并设置了适当的策略
```

### 2. Vercel 部署步骤

#### 2.1 连接 GitHub 仓库
1. 访问 [Vercel](https://vercel.com)
2. 点击 "Import Project"
3. 选择 "From Git Repository"
4. 连接您的GitHub账户
5. 选择包含项目的仓库

#### 2.2 项目配置
```json
// vercel.json (可选，用于高级配置)
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["fra1"],
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

#### 2.3 环境变量设置
在Vercel仪表板的项目设置中添加环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

#### 2.4 数据库迁移
确保生产数据库与本地数据库同步：
```bash
# 如果需要，可以使用Supabase CLI
npx supabase db push
```

### 3. 部署后配置

#### 3.1 域名配置
1. 在Vercel仪表板中，转到 Domains 部分
2. 添加您的自定义域名
3. 配置DNS记录指向Vercel提供的CNAME

#### 3.2 Supabase 生产配置
```sql
-- 在生产环境中更新回调URL
-- Settings > Authentication > URL Configuration
-- 添加您的生产域名
```

#### 3.3 SEO 和分析设置
1. **Google Analytics**
   ```typescript
   // src/lib/analytics.ts
   export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID
   ```

2. **Google Search Console**
   - 验证域名所有权
   - 提交站点地图

3. **站点地图配置**
   ```typescript
   // src/app/sitemap.ts
   export default function sitemap() {
     return [
       {
         url: 'https://your-domain.com',
         lastModified: new Date(),
         changeFrequency: 'daily',
         priority: 1,
       }
     ]
   }
   ```

### 4. 性能优化

#### 4.1 Vercel 优化
```javascript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['your-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
```

#### 4.2 缓存策略
```typescript
// src/app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { path } = await request.json()
  revalidatePath(path)
  return Response.json({ revalidated: true })
}
```

### 5. 监控和维护

#### 5.1 Vercel Analytics
- 内置性能监控
- 实时错误跟踪
- 用户行为分析

#### 5.2 Supabase 监控
- 数据库性能监控
- 认证事件日志
- 存储使用情况

#### 5.3 备份策略
```bash
# 设置自动备份
# Supabase > Settings > Database > Backups
# 启用每日备份
```

### 6. 故障排除

#### 常见问题
1. **环境变量未设置**
   - 检查Vercel环境变量配置
   - 确保变量名称正确

2. **数据库连接失败**
   - 验证Supabase URL和密钥
   - 检查防火墙设置

3. **构建失败**
   - 检查package.json依赖
   - 验证TypeScript配置

4. **CORS错误**
   - 配置Supabase CORS设置
   - 添加生产域名到允许列表

#### 调试步骤
1. 查看Vercel部署日志
2. 检查Supabase仪表板错误
3. 使用浏览器开发者工具
4. 测试本地生产构建

### 7. 部署清单

- [ ] Supabase项目创建并配置
- [ ] 环境变量设置
- [ ] 数据库模式迁移
- [ ] GitHub仓库连接
- [ ] Vercel项目创建
- [ ] 域名配置
- [ ] SSL证书验证
- [ ] SEO设置
- [ ] 性能测试
- [ ] 监控设置

---

有关详细的实施说明，请参考此目录中的各个文档文件。