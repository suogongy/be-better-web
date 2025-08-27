# 个人网站需求文档

## 1. 项目概述

### 1.1 项目描述
一个现代化的个人网站，使用Next.js构建，结合了个人博客和日常日程管理功能。该平台使用户能够撰写和管理博客文章，组织日常任务，并从已完成的计划中自动生成基于日程的博客内容。

### 1.2 主要功能
- **个人博客管理**：功能完整的博客平台，包含分类、编辑和评论功能
- **日常日程管理**：基于待办事项的规划系统，包含进度跟踪和每日摘要
- **集成**：从日程摘要自动生成博客内容
- **访客访问**：无需认证即可公开查看
- **用户认证**：集成Supabase Auth用于管理功能

### 1.3 目标用户
- **主要用户**：个人博客作者和生产力爱好者
- **次要用户**：博客内容的访问者和读者

## 2. 功能需求

### 2.1 博客管理系统

#### 2.1.1 内容管理
- **博客文章创建**：支持Markdown的富文本编辑器
- **草稿系统**：保存草稿并在准备好时发布
- **文章编辑**：博客文章的完整CRUD操作
- **文章删除**：软删除带恢复选项
- **批量操作**：选择多个文章进行批量操作

#### 2.1.2 组织功能
- **分类**：创建、编辑和分配文章分类
- **标签**：灵活的标签系统以便更好地发现内容
- **搜索**：跨文章、分类和标签的全文搜索
- **筛选**：按日期、分类、标签和状态筛选文章
- **排序**：按日期、受欢迎程度、标题或自定义顺序排序

#### 2.1.3 内容功能
- **特色图片**：上传和管理文章缩略图
- **媒体库**：集中式图片和文件管理
- **SEO优化**：元标题、描述和URL别名
- **发布选项**：立即发布、定时发布或草稿
- **文章状态**：已发布、草稿、存档或私有

#### 2.1.4 读者互动
- **评论系统**：嵌套评论带审核功能
- **社交分享**：热门社交平台的分享按钮
- **阅读时间**：自动估算阅读时间
- **相关文章**：基于算法的文章推荐
- **文章统计**：查看次数和互动指标

### 2.2 日程管理系统

#### 2.2.1 日常规划
- **待办事项创建**：添加带有描述和优先级的日常任务
- **任务分类**：对任务进行分类（工作、个人、健康等）
- **优先级**：高、中、低优先级分配
- **截止日期**：为任务设置具体日期和时间
- **重复任务**：支持每日、每周、每月重复

#### 2.2.2 进度跟踪
- **完成状态**：标记任务为完成/未完成
- **进度百分比**：跟踪复杂任务的部分完成情况
- **时间跟踪**：记录实际花费在任务上的时间
- **备注**：添加完成备注和反思
- **附件**：链接文件或图片到任务

#### 2.2.3 分析与摘要
- **每日摘要**：自动每日进度报告
- **每周/每月视图**：生产力的聚合视图
- **成就统计**：完成率和连续完成记录
- **生产力洞察**：峰值绩效时间的分析
- **目标跟踪**：长期目标进度监控

### 2.3 集成功能

#### 2.3.1 从日程生成博客
- **自动博客创建**：将每日摘要转换为博客文章
- **模板系统**：日程博客的可定制模板
- **内容增强**：为原始数据添加洞察和反思
- **发布控制**：自动发布前进行审核
- **分类分配**：自动将内容分类为"日程"文章

#### 2.3.2 跨平台功能
- **日历集成**：将日程导出到外部日历
- **数据导出**：以多种格式导出数据（JSON、CSV、PDF）
- **备份系统**：自动化备份以防止数据丢失
- **同步指示器**：显示跨功能的同步状态

### 2.4 用户体验功能

#### 2.4.1 公开访问
- **访客浏览**：无需注册即可完整阅读博客
- **响应式设计**：移动优先的响应式界面
- **快速加载**：使用SSG/SSR优化性能
- **SEO友好**：适当的元标签和结构化数据
- **可访问性**：WCAG 2.1 AA合规

#### 2.4.2 管理功能
- **仪表板**：全面的管理概览
- **内容分析**：详细的统计数据和洞察
- **用户管理**：个人资料和偏好管理
- **主题定制**：基本的主题选项和设置
- **通知系统**：评论、成就等的提醒

## 3. 非功能需求

### 3.1 性能
- **页面加载时间**：初始加载<3秒
- **交互时间**：<5秒
- **核心Web指标**：满足Google的核心Web指标标准
- **数据库优化**：高效查询和索引
- **缓存策略**：实现适当的缓存层

### 3.2 安全
- **认证**：通过Supabase的安全JWT认证
- **授权**：基于角色的访问控制
- **数据验证**：输入清理和验证
- **XSS防护**：防止跨站脚本攻击
- **CSRF防护**：跨站请求伪造防护

### 3.3 可扩展性
- **数据库设计**：可扩展的模式设计
- **API设计**：带分页的RESTful API
- **代码组织**：模块化和可维护的代码库
- **部署**：易于部署和扩展的选项
- **监控**：性能和错误监控

### 3.4 可用性
- **直观界面**：简洁且用户友好的设计
- **移动优化**：完整的移动功能
- **键盘导航**：完整的键盘可访问性
- **错误处理**：优雅的错误消息和恢复
- **加载状态**：清晰的加载指示器

## 4. 额外推荐功能

### 4.1 内容增强
- **新闻通讯订阅**：博客更新的邮件订阅
- **RSS订阅**：博客内容的标准RSS/Atom订阅
- **站点地图**：自动生成的XML站点地图
- **归档页面**：每月/每年归档导航
- **阅读列表**：个人阅读列表管理

### 4.2 生产力功能
- **习惯跟踪**：跟踪每日习惯和连续记录
- **目标设定**：SMART目标创建和跟踪
- **时间分块**：日历式时间管理
- **番茄工作法计时器**：内置专注计时器
- **心情跟踪**：每日心情和精力记录

### 4.3 社交功能
- **关于页面**：个人介绍和简历
- **联系表单**：带垃圾邮件防护的安全联系表单
- **推荐语**：显示访客反馈
- **访客留言簿**：简单的访客签名功能
- **社交链接**：社交媒体个人资料链接

### 4.4 技术功能
- **深色/浅色模式**：带系统偏好的主题切换
- **离线支持**：带PWA的基本离线功能
- **推送通知**：重要更新的Web推送
- **键盘快捷键**：高级用户键盘快捷键
- **多语言**：国际化支持（可选）

## 5. 数据模型概述

### 5.1 核心实体
- **用户**：认证和个人资料数据
- **文章**：博客内容和元数据
- **分类**：内容组织
- **标签**：灵活的内容标记
- **评论**：用户互动
- **任务**：日程和待办事项
- **摘要**：每日/每周进度摘要

### 5.2 关系
- 用户可以创建多个文章和任务
- 文章可以属于分类并有多个标签
- 文章可以有多个评论
- 任务可以生成摘要
- 摘要可以转换为文章

## 6. 成功标准

### 6.1 用户参与度
- 日程管理的每日活跃使用
- 定期创建和发布博客内容
- 通过评论和分享的访客参与
- 持续使用集成功能

### 6.2 技术成功
- 99.9%的正常运行时间和可靠性
- 所有设备的快速加载时间
- 零数据丢失和安全的数据处理
- 成功的部署和维护

### 6.3 内容目标
- 定期发布手动和自动生成的内容
- 增长的受众和参与度指标
- 有效的个人生产力改进
- 博客和日程功能的成功集成

## 7. 未来增强功能

### 7.1 高级功能
- **AI集成**：AI驱动的内容建议和洞察
- **协作**：与家人/团队成员分享日程
- **API访问**：第三方集成的公共API
- **插件系统**：可扩展架构用于自定义功能
- **高级分析**：详细的用户行为分析

### 7.2 内容功能
- **播客集成**：嵌入和管理播客节目
- **照片库**：专用的照片管理和展示
- **视频内容**：视频博客文章支持
- **电子书创建**：将博客系列转换为可下载电子书
- **内容日历**：内容规划的编辑日历

## 8. Vercel 部署实施指南

### 8.1 前置条件检查清单

在部署到Vercel之前，请确保满足以下要求：

#### 功能就绪状态
- [ ] 所有核心博客功能已实现（创建、编辑、发布、分类、标签）
- [ ] 日程管理功能完整（任务CRUD、进度跟踪、每日摘要）
- [ ] 自动博客生成功能已测试并工作正常
- [ ] 数据库模式已优化，RLS策略已配置
- [ ] 认证系统稳定运行
- [ ] 响应式设计已在多种设备上测试

#### 性能优化清单
- [ ] 页面加载时间<3秒
- [ ] Core Web Vitals分数合格
- [ ] 图片已优化并使用Next.js Image组件
- [ ] 数据库查询已优化，添加适当索引
- [ ] 静态资源正确缓存

#### 安全检查清单
- [ ] 环境变量配置安全
- [ ] Supabase RLS策略正确实施
- [ ] 输入验证和清理到位
- [ ] XSS和CSRF防护已启用
- [ ] 敏感信息未在客户端代码中暴露

### 8.2 Vercel 部署准备

#### 8.2.1 项目配置优化
```typescript
// next.config.ts - Vercel优化配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 性能优化
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  // 图片优化
  images: {
    domains: ['your-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // 静态优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 压缩和优化
  compress: true,

  // 安全头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

#### 8.2.2 环境变量模板
```env
# 生产环境变量模板 (.env.production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# NextAuth (如果使用)
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# 分析和监控
NEXT_PUBLIC_GA_ID=GA-TRACKING-ID
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# 其他配置
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

#### 8.2.3 构建优化
```json
// package.json 构建脚本
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 8.3 部署流程

#### 步骤1：代码准备
```bash
# 1. 提交所有更改到Git
git add .
git commit -m "Prepare for production deployment"
git push origin main

# 2. 创建生产分支（可选）
git checkout -b production
git push origin production
```

#### 步骤2：Vercel项目设置
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Import Project"
3. 连接GitHub仓库
4. 选择项目并点击 "Import"

#### 步骤3：环境变量配置
在Vercel项目设置中添加所有必需的环境变量：
- Supabase URL和密钥
- NextAuth配置（如果使用）
- 分析工具ID
- 自定义域名

#### 步骤4：构建配置
```json
// vercel.json (高级配置)
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["fra1"],
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 8.4 部署后验证

#### 功能测试清单
- [ ] 网站成功加载，无错误
- [ ] 博客文章正常显示
- [ ] 用户认证工作正常
- [ ] 日程管理功能可用
- [ ] 自动博客生成功能正常
- [ ] 移动端响应式正常
- [ ] 所有内部链接工作正常

#### 性能验证
- [ ] Lighthouse分数>90
- [ ] 首次内容绘制<2秒
- [ ] 最大内容绘制<3秒
- [ ] 页面大小合理
- [ ] Core Web Vitals通过

#### SEO验证
- [ ] 页面标题和元描述正确
- [ ] Open Graph标签存在
- [ ] 结构化数据有效
- [ ] robots.txt可访问
- [ ] XML站点地图生成

### 8.5 生产监控

#### 8.5.1 Vercel Analytics
Vercel内置分析提供：
- 实时性能指标
- 错误跟踪
- 用户行为洞察
- 地理位置分析

#### 8.5.2 外部监控工具
```typescript
// Sentry配置 (src/lib/sentry.ts)
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

#### 8.5.3 自定义监控
```typescript
// 性能监控 (src/lib/performance.ts)
export const trackPerformance = () => {
  if (typeof window !== 'undefined') {
    // Web Vitals跟踪
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
  }
}
```

### 8.6 备份和灾难恢复

#### 8.6.1 Supabase备份
```sql
-- 启用自动备份
-- 在Supabase控制台中：
-- Settings > Database > Backups
-- 启用每日备份到AWS S3
```

#### 8.6.2 代码备份
- 使用Git进行版本控制
- 定期创建发布标签
- 维护部署脚本

#### 8.6.3 数据导出策略
```typescript
// 数据导出功能 (src/app/api/export/route.ts)
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 导出博客文章
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')

  // 导出任务和摘要
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')

  return Response.json({ posts, tasks })
}
```

### 8.7 常见部署问题解决

#### 8.7.1 构建失败
```bash
# 检查常见问题：
# 1. TypeScript错误
npm run type-check

# 2. ESLint错误
npm run lint

# 3. 依赖问题
rm -rf node_modules package-lock.json
npm install
```

#### 8.7.2 运行时错误
- 检查环境变量配置
- 验证Supabase连接
- 查看Vercel函数日志
- 检查数据库RLS策略

#### 8.7.3 性能问题
- 优化图片大小
- 实现适当缓存
- 减少JavaScript包大小
- 使用CDN加速

### 8.8 部署清单总结

#### 预部署检查
- [ ] 所有功能测试通过
- [ ] 性能优化完成
- [ ] 安全审查完成
- [ ] 环境变量配置正确

#### 部署执行
- [ ] 代码推送到Git仓库
- [ ] Vercel项目创建成功
- [ ] 环境变量设置完成
- [ ] 自定义域名配置

#### 部署后验证
- [ ] 网站正常运行
- [ ] 所有功能工作正常
- [ ] 性能指标达标
- [ ] SEO设置正确

#### 监控设置
- [ ] Vercel Analytics启用
- [ ] 外部监控工具配置
- [ ] 错误跟踪设置
- [ ] 备份策略实施

此需求文档为开发一个全面的个人网站奠定了基础，该网站有效地将博客和生产力管理结合在一个用户友好、高性能且安全的平台中。同时提供了详细的Vercel部署指南，确保项目能够顺利上线并稳定运行。