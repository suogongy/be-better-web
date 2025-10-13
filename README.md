# Be Better Web

一个基于 Next.js 构建的现代化个人网站，结合了个人博客和日常日程管理功能。该平台使用户能够撰写和管理博客文章、组织日常任务，并从已完成计划中自动生成基于日程的博客内容。

## 🚀 功能特性

### ✅ **第一阶段 - 基础架构（已完成）**
- **个人博客管理**：功能完整的博客平台，支持分类、编辑和评论
- **日常日程管理**：基于待办事项的规划系统，具有进度跟踪和每日总结
- **集成功能**：从日程总结自动生成博客内容
- **访客访问**：无需身份验证的公开浏览
- **用户认证**：集成 Supabase Auth 的管理员功能
- **响应式设计**：移动优先的响应式界面，支持主题系统（亮色/暗色模式）

### 🔄 **即将推出的功能**
- 基于 TipTap 的富文本博客编辑器
- 具有日历视图的高级任务管理
- 生产力分析和洞察
- 具有审核功能的评论系统
- SEO 优化和性能增强

## 🛠 技术栈

- **框架**：Next.js 15.5.0 with App Router
- **前端**：React 19.1.0, TypeScript 5+, Tailwind CSS v4
- **后端**：Supabase (PostgreSQL 数据库, Authentication, Storage)
- **UI 组件**：基于 Radix UI 基元的自定义组件库
- **表单处理**：React Hook Form with Zod validation
- **富文本**：TipTap editor
- **图标**：Lucide React
- **构建工具**：Turbopack

## 📦 前置要求

在开始之前，请确保您具备：

- 已安装 Node.js 18+
- 一个 Supabase 账户和项目
- 用于版本控制的 Git

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd be-better-web
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```

2. 在 `.env.local` 中填写您的 Supabase 凭证：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   从您的 Supabase 项目仪表板获取这些值：
   `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`

### 4. 设置数据库

1. **创建 Supabase 项目**：
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 等待项目准备就绪

2. **运行数据库架构**：
   - 打开您的 Supabase 项目仪表板
   - 转到 SQL 编辑器
   - 复制并粘贴 `src/lib/supabase/schema.sql` 的内容
   - 执行脚本

3. **设置 RLS 策略**：
   - 在同一个 SQL 编辑器中
   - 复制并粘贴 `src/lib/supabase/rls-policies.sql` 的内容
   - 执行脚本

4. **验证设置**：
   ```bash
   npm run setup-db
   ```

### 5. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用程序。

## 🗂 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由
│   │   ├── login/
│   │   └── register/
│   ├── blog/                     # 公开博客路由
│   ├── dashboard/                # 受保护的管理员路由
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 可复用组件
│   ├── ui/                       # 基础 UI 组件
│   ├── layout/                   # 布局组件
│   └── forms/                    # 表单组件
├── lib/                          # 工具库
│   ├── supabase/                 # Supabase 配置
│   ├── auth/                     # 认证工具
│   ├── theme/                    # 主题管理
│   ├── validation/               # Zod 架构
│   └── utils.ts                  # 通用工具
├── types/                        # TypeScript 类型定义
└── constants/                    # 应用程序常量
```

## 🔧 可用脚本

- `npm run dev` - 使用 Turbopack 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint
- `npm run setup-db` - 数据库设置辅助脚本

## 🎨 UI 组件

该项目包含一个全面的 UI 组件库：

- **表单组件**：Button, Input, Textarea, Select, Checkbox
- **布局组件**：Card, Modal, Loading, Badge
- **导航**：具有响应式菜单和主题切换的 Header
- **反馈**：Toast 通知, Loading 状态
- **主题**：亮色/暗色/系统主题支持

## 🔐 认证

- **注册/登录**：邮箱和密码认证
- **受保护路由**：仪表板和管理员功能
- **行级安全**：数据库级别的安全策略
- **用户配置文件**：注册时自动创建配置文件

## 🗄 数据库架构

该应用程序使用全面的 PostgreSQL 架构：

- **用户**：具有首选项的扩展用户配置文件
- **文章**：具有分类和标签的博客文章
- **分类和标签**：内容组织
- **评论**：嵌套评论系统
- **任务**：日常任务管理
- **每日总结**：生产力跟踪

## 🚧 开发状态

### ✅ 已完成（第一阶段）
- [x] 项目设置和依赖
- [x] 数据库架构和 RLS 策略
- [x] 认证系统
- [x] UI 组件库
- [x] 响应式布局和导航
- [x] 主题系统（亮色/暗色模式）
- [x] 带有模拟数据的基本博客页面
- [x] 仪表板结构

### 🔄 进行中（第二阶段）
- [ ] 使用 TipTap 创建和编辑博客文章
- [ ] 分类和标签管理
- [ ] 带有 SEO 的公开博客页面
- [ ] 评论系统

### 📋 计划中（第三阶段及以后）
- [ ] 任务管理系统
- [ ] 日历集成
- [ ] 每日总结系统
- [ ] 从日程生成博客
- [ ] 高级功能和分析
- [ ] 性能优化
- [ ] 测试和部署

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 彻底测试
5. 提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证授权。

## 🆘 支持

如果在设置过程中遇到任何问题：

1. 检查所有环境变量是否正确设置
2. 验证您的 Supabase 项目是否活跃且可访问
3. 确保数据库架构已应用
4. 检查控制台是否有任何错误消息

如需额外帮助，请在仓库中创建 issue。

---

**快乐编码！🚀**
