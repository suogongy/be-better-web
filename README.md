# Be Better Web

A modern personal website built with Next.js that combines personal blogging and daily schedule management functionalities. The platform enables users to write and manage blog posts, organize daily tasks, and automatically generate schedule-based blog content from completed plans.

## 🚀 Features

### ✅ **Phase 1 - Foundation (COMPLETE)**
- **Personal Blog Management**: Full-featured blogging platform with categories, editing, and commenting
- **Daily Schedule Management**: Todo-based planning system with progress tracking and daily summaries
- **Integration**: Automatic blog generation from schedule summaries
- **Guest Access**: Public viewing without authentication requirement
- **User Authentication**: Supabase Auth integration for admin features
- **Responsive Design**: Mobile-first responsive interface with theme system (light/dark mode)

### 🔄 **Upcoming Features**
- Rich text blog editor with TipTap
- Advanced task management with calendar views
- Productivity analytics and insights
- Comment system with moderation
- SEO optimization and performance enhancements

## 🛠 Technology Stack

- **Framework**: Next.js 15.5.0 with App Router
- **Frontend**: React 19.1.0, TypeScript 5+, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **UI Components**: Custom component library with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor
- **Icons**: Lucide React
- **Build Tool**: Turbopack

## 📦 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- Git for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd be-better-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   Get these values from your Supabase project dashboard:
   `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`

### 4. Set Up the Database

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Run Database Schema**:
   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of `src/lib/supabase/schema.sql`
   - Execute the script

3. **Set Up RLS Policies**:
   - In the same SQL Editor
   - Copy and paste the contents of `src/lib/supabase/rls-policies.sql`
   - Execute the script

4. **Verify Setup**:
   ```bash
   npm run setup-db
   ```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🗂 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── blog/                     # Public blog routes
│   ├── dashboard/                # Protected admin routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   └── forms/                    # Form components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase configuration
│   ├── auth/                     # Authentication utilities
│   ├── theme/                    # Theme management
│   ├── validation/               # Zod schemas
│   └── utils.ts                  # General utilities
├── types/                        # TypeScript type definitions
└── constants/                    # Application constants
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup-db` - Database setup helper script

## 🎨 UI Components

The project includes a comprehensive UI component library:

- **Form Components**: Button, Input, Textarea, Select, Checkbox
- **Layout Components**: Card, Modal, Loading, Badge
- **Navigation**: Header with responsive menu and theme toggle
- **Feedback**: Toast notifications, Loading states
- **Theme**: Light/Dark/System theme support

## 🔐 Authentication

- **Sign Up/Sign In**: Email and password authentication
- **Protected Routes**: Dashboard and admin features
- **Row Level Security**: Database-level security policies
- **User Profiles**: Automatic profile creation on signup

## 🗄 Database Schema

The application uses a comprehensive PostgreSQL schema:

- **Users**: Extended user profiles with preferences
- **Posts**: Blog posts with categories and tags
- **Categories & Tags**: Content organization
- **Comments**: Nested comment system
- **Tasks**: Daily task management
- **Daily Summaries**: Productivity tracking

## 🚧 Development Status

### ✅ Completed (Phase 1)
- [x] Project setup and dependencies
- [x] Database schema and RLS policies
- [x] Authentication system
- [x] UI component library
- [x] Responsive layout and navigation
- [x] Theme system (light/dark mode)
- [x] Basic blog pages with mock data
- [x] Dashboard structure

### 🔄 In Progress (Phase 2)
- [ ] Blog post creation and editing with TipTap
- [ ] Category and tag management
- [ ] Public blog pages with SEO
- [ ] Comment system

### 📋 Planned (Phase 3+)
- [ ] Task management system
- [ ] Calendar integration
- [ ] Daily summary system
- [ ] Blog generation from schedules
- [ ] Advanced features and analytics
- [ ] Performance optimization
- [ ] Testing and deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues during setup:

1. Check that all environment variables are correctly set
2. Verify your Supabase project is active and accessible
3. Ensure the database schema has been applied
4. Check the console for any error messages

For additional help, please create an issue in the repository.

---

**Happy coding! 🚀**
