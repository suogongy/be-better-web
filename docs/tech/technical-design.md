# Personal Website Technical Design Document

## 1. Technology Stack

### 1.1 Frontend Framework
- **Next.js 15.5.0**: React-based framework with App Router
- **React 19.1.0**: Latest React version with concurrent features
- **TypeScript 5+**: Type-safe development with latest TS features
- **Tailwind CSS v4**: Utility-first CSS framework for rapid styling

### 1.2 Backend & Database
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **Supabase Auth**: Authentication and user management
- **Supabase Storage**: File and media storage
- **Supabase Edge Functions**: Serverless functions for custom logic

### 1.3 Development Tools
- **ESLint 9+**: Code linting and quality assurance
- **Turbopack**: Fast bundler for development and production builds
- **PostCSS**: CSS processing and optimization
- **Prettier**: Code formatting (recommended addition)

### 1.4 Additional Libraries
- **@supabase/supabase-js**: Supabase client library
- **@tiptap/react**: Rich text editor for blog posts
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation library
- **date-fns**: Date manipulation and formatting
- **framer-motion**: Animation library
- **react-hot-toast**: Toast notifications
- **lucide-react**: Icon library

## 2. Architecture Design

### 2.1 Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected admin routes
│   │   ├── admin/
│   │   ├── blog/
│   │   └── schedule/
│   ├── blog/                     # Public blog routes
│   │   ├── [slug]/
│   │   └── category/[name]/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── blog/
│   │   └── schedule/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   ├── blog/                     # Blog-specific components
│   ├── schedule/                 # Schedule-specific components
│   ├── forms/                    # Form components
│   └── layout/                   # Layout components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase configuration
│   ├── auth/                     # Authentication utilities
│   ├── validation/               # Zod schemas
│   ├── utils/                    # General utilities
│   └── hooks/                    # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Additional styles
└── constants/                    # Application constants
```

### 2.2 Database Schema

#### 2.2.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  social_links JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.2 Blog Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  type VARCHAR(20) DEFAULT 'manual', -- 'manual' or 'schedule_generated'
  meta_title VARCHAR(255),
  meta_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);
```

#### 2.2.3 Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.4 Tags Table
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.5 Post-Category Junction
```sql
CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
```

#### 2.2.6 Post-Tag Junction
```sql
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

#### 2.2.7 Comments Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_website VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'spam'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.8 Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  progress INTEGER DEFAULT 0, -- 0-100
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  due_date DATE,
  due_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB, -- Stores recurrence rules
  completion_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.9 Daily Summaries Table
```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  total_planned_time INTEGER, -- in minutes
  total_actual_time INTEGER, -- in minutes
  productivity_score DECIMAL(5,2),
  mood_rating INTEGER, -- 1-5 scale
  energy_rating INTEGER, -- 1-5 scale
  notes TEXT,
  achievements JSONB,
  challenges JSONB,
  tomorrow_goals JSONB,
  auto_blog_generated BOOLEAN DEFAULT FALSE,
  generated_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);
```

### 2.3 API Design

#### 2.3.1 Authentication Endpoints
```typescript
// Supabase Auth handles most auth operations
// Custom API routes for additional functionality

// POST /api/auth/profile
interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  website?: string;
  social_links?: Record<string, string>;
}

// GET /api/auth/preferences
// PUT /api/auth/preferences
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  auto_blog_generation: boolean;
  default_blog_category: string;
}
```

#### 2.3.2 Blog Endpoints
```typescript
// GET /api/blog/posts
interface GetPostsQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  status?: 'published' | 'draft';
  search?: string;
  sort?: 'date' | 'title' | 'views';
  order?: 'asc' | 'desc';
}

// GET /api/blog/posts/[slug]
// POST /api/blog/posts
// PUT /api/blog/posts/[id]
// DELETE /api/blog/posts/[id]
interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  status: 'draft' | 'published';
  categories: string[];
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
}

// GET /api/blog/categories
// POST /api/blog/categories
// PUT /api/blog/categories/[id]
// DELETE /api/blog/categories/[id]

// GET /api/blog/tags
// POST /api/blog/tags

// GET /api/blog/comments/[post_id]
// POST /api/blog/comments
// PUT /api/blog/comments/[id]/status
interface CreateCommentRequest {
  post_id: string;
  parent_id?: string;
  author_name: string;
  author_email: string;
  author_website?: string;
  content: string;
}
```

#### 2.3.3 Schedule Endpoints
```typescript
// GET /api/schedule/tasks
interface GetTasksQuery {
  date?: string; // YYYY-MM-DD
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

// POST /api/schedule/tasks
// PUT /api/schedule/tasks/[id]
// DELETE /api/schedule/tasks/[id]
interface CreateTaskRequest {
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  due_time?: string;
  estimated_minutes?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

// GET /api/schedule/summaries
// GET /api/schedule/summaries/[date]
// POST /api/schedule/summaries
// PUT /api/schedule/summaries/[date]
interface CreateSummaryRequest {
  summary_date: string;
  mood_rating?: number;
  energy_rating?: number;
  notes?: string;
  achievements?: string[];
  challenges?: string[];
  tomorrow_goals?: string[];
}

// POST /api/schedule/generate-blog
interface GenerateBlogRequest {
  summary_date: string;
  template?: 'default' | 'detailed' | 'minimal';
  include_tasks?: boolean;
  include_metrics?: boolean;
  auto_publish?: boolean;
}
```

### 2.4 Component Architecture

#### 2.4.1 UI Components (src/components/ui/)
```typescript
// Base components using Tailwind CSS
- Button
- Input
- Textarea
- Select
- Checkbox
- RadioGroup
- Badge
- Card
- Modal
- Dropdown
- DatePicker
- TimePicker
- Progress
- Spinner
- Toast
- Tooltip
- Tabs
- Accordion
```

#### 2.4.2 Blog Components (src/components/blog/)
```typescript
// BlogPostCard.tsx
interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    featured_image?: string;
    published_at: string;
    view_count: number;
    categories: Category[];
    tags: Tag[];
  };
  showActions?: boolean;
}

// BlogEditor.tsx
interface BlogEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  autosave?: boolean;
}

// CommentSection.tsx
interface CommentSectionProps {
  postId: string;
  allowNewComments?: boolean;
}

// CategoryFilter.tsx
// TagCloud.tsx
// BlogSearch.tsx
// RelatedPosts.tsx
```

#### 2.4.3 Schedule Components (src/components/schedule/)
```typescript
// TaskList.tsx
interface TaskListProps {
  date?: Date;
  category?: string;
  showCompleted?: boolean;
  editable?: boolean;
}

// TaskForm.tsx
interface TaskFormProps {
  task?: Task;
  onSubmit: (task: TaskData) => void;
  onCancel: () => void;
}

// DailySummary.tsx
interface DailySummaryProps {
  date: Date;
  tasks: Task[];
  summary?: DailySummary;
  onSave: (summary: DailySummaryData) => void;
}

// Calendar.tsx
// ProgressChart.tsx
// ProductivityMetrics.tsx
// HabitTracker.tsx
```

### 2.5 State Management

#### 2.5.1 Client-Side State
```typescript
// Use React's built-in state management
// Context for global state (auth, theme, notifications)
// React Hook Form for form state
// SWR or React Query for server state

// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
}

// ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: string) => void;
  resolvedTheme: 'light' | 'dark';
}
```

#### 2.5.2 Server State
```typescript
// Custom hooks for API calls
// useBlogPosts.ts
export function useBlogPosts(params?: GetPostsQuery) {
  return useSWR(['posts', params], () => fetchPosts(params));
}

// useTasks.ts
export function useTasks(params?: GetTasksQuery) {
  return useSWR(['tasks', params], () => fetchTasks(params));
}

// useComments.ts
export function useComments(postId: string) {
  return useSWR(['comments', postId], () => fetchComments(postId));
}
```

## 3. Implementation Plan

### 3.1 Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize Supabase project
   - Set up database schema and RLS policies
   - Configure authentication
   - Set up basic project structure

2. **Core UI Components**
   - Implement base UI component library
   - Set up layout components
   - Create responsive navigation
   - Implement theme system

3. **Authentication System**
   - Implement login/register pages
   - Set up protected routes
   - Create auth context and hooks
   - Basic profile management

### 3.2 Phase 2: Blog System (Week 3-4)
1. **Blog Core Features**
   - Post creation and editing with rich text editor
   - Category and tag management
   - Draft and publish system
   - Public blog pages with SEO optimization

2. **Blog Management**
   - Admin dashboard for post management
   - Bulk operations for posts
   - Media library and image uploads
   - Search and filtering functionality

3. **Comment System**
   - Comment display and threading
   - Comment moderation system
   - Spam protection
   - Email notifications

### 3.3 Phase 3: Schedule System (Week 5-6)
1. **Task Management**
   - Task CRUD operations
   - Priority and category system
   - Due date and time management
   - Progress tracking

2. **Calendar Integration**
   - Calendar view for tasks
   - Daily/weekly/monthly views
   - Drag and drop task scheduling
   - Recurring task support

3. **Analytics and Summaries**
   - Daily summary creation
   - Progress metrics and charts
   - Productivity insights
   - Goal tracking

### 3.4 Phase 4: Integration Features (Week 7-8)
1. **Blog Generation**
   - Auto-generate blogs from summaries
   - Template system for generated content
   - Review and editing before publishing
   - Integration with existing blog system

2. **Advanced Features**
   - Habit tracking
   - Mood and energy logging
   - Advanced analytics
   - Export functionality

3. **Performance and SEO**
   - Optimize for Core Web Vitals
   - Implement proper meta tags
   - Set up sitemap and RSS feed
   - Image optimization

### 3.5 Phase 5: Polish and Deploy (Week 9-10)
1. **Testing and Quality Assurance**
   - Comprehensive testing
   - Performance optimization
   - Security audit
   - Accessibility improvements

2. **Documentation and Deployment**
   - User documentation
   - Deployment setup
   - Monitoring and analytics
   - Backup systems

## 4. Security Considerations

### 4.1 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Users can read published posts" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summaries" ON daily_summaries
  FOR ALL USING (auth.uid() = user_id);
```

### 4.2 Input Validation
```typescript
// Zod schemas for all API inputs
export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  status: z.enum(['draft', 'published']),
  categories: z.array(z.string().uuid()),
  tags: z.array(z.string()),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().date().optional(),
});
```

### 4.3 Content Security
- Sanitize HTML content in blog posts
- Validate file uploads
- Rate limiting on API endpoints
- CSRF protection
- XSS prevention

## 5. Performance Optimization

### 5.1 Database Optimization
- Proper indexing on frequently queried columns
- Query optimization and pagination
- Connection pooling
- Database function for complex queries

### 5.2 Frontend Optimization
- Next.js Image optimization
- Static generation for public pages
- Code splitting and lazy loading
- Service worker for caching

### 5.3 Caching Strategy
- Static page caching
- API response caching
- CDN for static assets
- Browser caching headers

## 6. Deployment and DevOps

### 6.1 Environment Setup
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 6.2 Deployment Options
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative with similar features
- **Railway/Render**: Alternative hosting platforms
- **Self-hosted**: Docker containerization option

### 6.3 Monitoring and Analytics
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database and auth monitoring
- **Google Analytics**: User behavior tracking
- **Sentry**: Error tracking and performance monitoring

## 7. Testing Strategy

### 7.1 Unit Testing
- Jest for utility functions
- React Testing Library for components
- Test coverage requirements

### 7.2 Integration Testing
- API endpoint testing
- Database integration tests
- Authentication flow testing

### 7.3 End-to-End Testing
- Playwright or Cypress for E2E tests
- Critical user journey testing
- Cross-browser compatibility

This technical design provides a comprehensive blueprint for implementing the personal website with blog and schedule management features using modern web technologies and best practices.