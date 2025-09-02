# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Be Better Web** is a modern personal website platform that combines blog management with daily productivity and schedule management. Built with Next.js 15, React 19, and Supabase, this application enables users to manage their personal blogs while tracking daily tasks and automatically generating blog content from completed schedules.

### Key Features
- **Personal Blog Management**: Full-featured blogging with categories, tags, and rich text editing
- **Daily Schedule Management**: Task tracking with progress monitoring and daily summaries
- **Automatic Blog Generation**: Create blog posts from daily schedule summaries
- **User Authentication**: Supabase-based authentication with user profiles
- **Responsive Design**: Mobile-first interface with dark/light theme support
- **Analytics & Insights**: Productivity tracking and performance metrics

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 15.5.0 (App Router) + React 19.1.0 + TypeScript 5+
- **Styling**: Tailwind CSS v4 with custom component library
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor for blog content
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React Context + SWR for server state

### Development Tools
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint 9+ with Next.js config
- **Build**: Turbopack (Next.js default)
- **Package Manager**: npm

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (login, register, forgot-password)
│   ├── api/                      # API routes
│   │   ├── analytics/            # Performance and analytics endpoints
│   │   └── debug-comments/       # Debug utilities
│   ├── auth/                     # Authentication pages
│   ├── blog/                     # Blog-related pages
│   │   ├── [slug]/               # Individual blog posts
│   │   ├── admin/                # Blog administration
│   │   └── new/                  # Create new blog posts
│   ├── dashboard/                # Main dashboard
│   ├── debug-comments/           # Debug page for comments
│   ├── export/                   # Data export functionality
│   ├── habits/                   # Habit tracking
│   ├── insights/                 # Analytics and insights
│   ├── mood/                     # Mood tracking
│   ├── schedule/                 # Schedule management
│   ├── summary/                  # Daily summaries
│   ├── user/                     # User profiles
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Homepage
│   └── robots.ts                 # SEO configuration
├── components/                   # Reusable components
│   ├── auth/                     # Authentication components
│   ├── blog/                     # Blog-specific components
│   ├── editor/                   # Rich text editor (TipTap)
│   ├── export/                   # Export functionality components
│   ├── habits/                   # Habit tracking components
│   ├── insights/                 # Analytics components
│   ├── layout/                   # Layout components (header, footer)
│   ├── mood/                     # Mood tracking components
│   ├── summary/                  # Daily summary components
│   ├── tasks/                    # Task management components
│   ├── ui/                       # Base UI components (button, input, card, etc.)
│   └── toast-provider.tsx        # Toast notifications
├── lib/                          # Utility libraries
│   ├── auth/                     # Authentication context and utilities
│   ├── performance/              # Performance monitoring
│   ├── seo/                      # SEO utilities
│   ├── supabase/                 # Supabase configuration and services
│   │   ├── client.ts             # Supabase client setup
│   │   └── services/             # Database service layer
│   ├── testing/                  # Test setup and utilities
│   ├── theme/                    # Theme management (light/dark)
│   ├── utils/                    # General utility functions
│   └── validation/               # Zod validation schemas
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database types from Supabase
```

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

### Core Tables
- **users**: Extended user profiles with preferences and social links
- **posts**: Blog posts with status, type, and SEO metadata
- **categories**: Blog post categories with colors
- **tags**: Blog post tags
- **post_categories**: Junction table for posts and categories
- **post_tags**: Junction table for posts and tags
- **comments**: Nested comment system with moderation
- **tasks**: Daily task management with priorities and progress tracking
- **daily_summaries**: Productivity tracking with mood and energy ratings
- **data_exports**: Export functionality for user data

### Key Features
- **Row Level Security (RLS)**: All tables have proper RLS policies
- **UUID Primary Keys**: All tables use UUIDs for security
- **Audit Fields**: Created_at and updated_at timestamps
- **Foreign Key Constraints**: Proper relationships between tables
- **Check Constraints**: Status and priority validation

## Authentication System

### Supabase Integration
- **Authentication**: Email/password authentication with Supabase Auth
- **User Profiles**: Extended user data in custom users table
- **Session Management**: Automatic session handling with persistence
- **Error Handling**: Comprehensive error handling with network timeout detection
- **Auto Profile Creation**: Users automatically created in database on signup

### Auth Context
The `AuthContext` provides:
- `user`: Current user object or null
- `loading`: Loading state during authentication checks
- `error`: Error messages for authentication issues
- `signIn`, `signUp`, `signOut`, `resetPassword`: Authentication methods

## Component Architecture

### UI Component Library
Custom component library built with Radix UI primitives and Tailwind CSS:

#### Base Components (`src/components/ui/`)
- **Button**: Multiple variants (default, outline, ghost, etc.) with loading states
- **Input**: Form inputs with validation states
- **Card**: Flexible card components for content sections
- **Modal**: Dialog components for overlays
- **Toast**: Notification system for user feedback
- **Loading**: Loading indicators with customizable text

### Feature-Specific Components
- **Blog Components**: Post cards, editor, comment sections
- **Task Components**: Task lists, forms, progress tracking
- **Schedule Components**: Calendar views, daily summaries
- **Analytics Components**: Charts, metrics, insights

## State Management

### Client-Side State
- **React Context**: Global state for authentication and theme
- **React Hook Form**: Form state management with validation
- **Local State**: Component-level state with useState

### Server State
- **SWR**: Data fetching and caching
- **Supabase Queries**: Direct database queries with proper error handling
- **Optimistic Updates**: UI updates before server confirmation

## Development Workflow

### Setup Instructions
1. **Clone and Install**: `npm install`
2. **Environment Variables**: Copy `.env.example` to `.env.local` and configure Supabase
3. **Database Setup**: Run `npm run setup-db` and execute SQL in Supabase dashboard
4. **Development**: `npm run dev` to start development server

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run setup-db` - Database setup helper

### Testing Strategy
- **Unit Tests**: Jest for utility functions and components
- **Integration Tests**: React Testing Library for component interactions
- **Mocking**: Comprehensive mocking for Supabase, Next.js, and browser APIs
- **Coverage**: 70% coverage threshold for all files
- **Test Location**: Tests in `__tests__` directories or `*.test.{ts,tsx}` files
- **Path Aliases**: `@/` maps to `src/` directory in imports

### Environment Configuration
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=development
```

## Key Development Patterns

### File Organization
- **Colocation**: Components near their usage
- **Feature-Based**: Organization by feature rather than file type
- **Type Safety**: Comprehensive TypeScript definitions
- **Consistent Naming**: Clear, descriptive naming conventions

### Code Style
- **TypeScript**: Strict mode with proper type definitions
- **ESLint**: Next.js recommended configuration
- **Tailwind CSS**: Utility-first styling with custom design system
- **React Best Practices**: Hooks, functional components, proper key usage

### Error Handling
- **Network Errors**: Automatic retry and user feedback
- **Validation Errors**: Zod schema validation with clear error messages
- **Authentication Errors**: Graceful handling with redirect to login
- **Database Errors**: Proper error logging and user-friendly messages

## Performance Considerations

### Frontend Optimization
- **Next.js Features**: App Router, static generation, image optimization
- **Code Splitting**: Automatic with Next.js
- **Lazy Loading**: Components and images loaded on demand
- **Caching**: SWR for efficient data fetching

### Database Optimization
- **Indexing**: Proper indexes on frequently queried columns
- **Query Optimization**: Efficient queries with proper filtering
- **Connection Pooling**: Supabase handles connection management
- **RLS Policies**: Database-level security without performance overhead

## Deployment

### Vercel Deployment (Recommended)
1. **Connect Repository**: Link GitHub repository to Vercel
2. **Environment Variables**: Configure all required environment variables
3. **Database Setup**: Ensure production database is properly configured
4. **Domain Configuration**: Set up custom domain and SSL

### Environment-Specific Considerations
- **Development**: Local development with hot reload
- **Staging**: Preview deployments for testing
- **Production**: Optimized builds with proper caching and CDN

## Common Development Tasks

### Adding New Features
1. **Database Changes**: Update schema and types
2. **API Routes**: Create new endpoints if needed
3. **Components**: Build reusable components
4. **Pages**: Create new pages in appropriate directories
5. **Testing**: Add comprehensive tests
6. **Documentation**: Update relevant documentation

### Debugging Common Issues
- **Authentication Issues**: Check environment variables and Supabase configuration
- **Database Issues**: Verify RLS policies and table relationships
- **Build Issues**: Check TypeScript errors and dependencies
- **Performance Issues**: Use Next.js dev tools and browser profiling

## Code Quality Standards

### TypeScript Standards
- **Strict Mode**: Always use strict TypeScript settings
- **Type Definitions**: Comprehensive types for all data structures
- **Error Handling**: Proper error types and handling
- **Null Safety**: Use proper null checking and optional chaining

### React Standards
- **Component Structure**: Functional components with hooks
- **Props Validation**: TypeScript interfaces for all props
- **State Management**: Use appropriate state management solutions
- **Accessibility**: Follow WCAG guidelines and use semantic HTML

### Testing Standards
- **Test Coverage**: Maintain 70% coverage minimum
- **Test Structure**: Clear test organization with descriptive names
- **Mocking**: Mock external dependencies appropriately
- **Integration Testing**: Test component interactions and user flows

## Security Considerations

### Authentication Security
- **Supabase Auth**: Leverage Supabase's secure authentication
- **Session Management**: Proper session handling and expiration
- **Password Security**: Supabase handles password hashing and security
- **CSRF Protection**: Built-in with Supabase Auth

### Data Security
- **Row Level Security**: All database tables have RLS policies
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Parameterized queries with Supabase
- **XSS Prevention**: Proper content sanitization and escaping

### Environment Security
- **Secrets Management**: Environment variables for sensitive data
- **API Key Security**: Proper key management and rotation
- **CORS Configuration**: Proper CORS settings for API endpoints
- **HTTPS Enforcement**: SSL/TLS for all communications

## Contributing Guidelines

### Development Process
1. **Feature Branches**: Create branches for new features
2. **Code Reviews**: All changes require review
3. **Testing**: Ensure all tests pass
4. **Documentation**: Update relevant documentation
5. **Deployment**: Merge to main branch for deployment

### Git Workflow
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: Feature branches
- **hotfix/**: Emergency fixes

### Commit Standards
- **Conventional Commits**: Use conventional commit format
- **Clear Messages**: Descriptive commit messages
- **Atomic Changes**: Small, focused commits
- **Branch Naming**: Consistent branch naming convention

## Additional Resources

### Documentation
- **Technical Design**: `docs/tech/technical-design.md` (in Chinese)
- **Requirements**: `docs/tech/requirements.md`
- **Development Roadmap**: `docs/tech/development-roadmap.md`
- **Supabase Integration**: `docs/tech/supabase-integration.md`

### Database Schema
- **Final Schema**: `schema-final.sql` (in project root)
- **Setup Script**: `scripts/setup-db.js`

### Configuration Files
- **Next.js Config**: `next.config.ts`
- **TypeScript Config**: `tsconfig.json`
- **ESLint Config**: `eslint.config.mjs`
- **Jest Config**: `jest.config.js`

## Getting Help

### Common Issues
1. **Authentication Problems**: Check Supabase configuration and environment variables
2. **Database Connection**: Verify Supabase project is active and accessible
3. **Build Errors**: Check TypeScript errors and missing dependencies
4. **Performance Issues**: Review database queries and frontend optimization

### Debugging Tools
- **Next.js Dev Tools**: Built-in development tools
- **Supabase Dashboard**: Database and authentication monitoring
- **Browser Dev Tools**: Performance debugging and network analysis
- **Console Logging**: Comprehensive logging throughout the application

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check existing documentation
- **Community**: Engage with the development community
- **Supabase Support**: Database and authentication issues

---

This guide provides a comprehensive overview of the Be Better Web project for Claude AI assistants. The codebase follows modern React and Next.js best practices with a focus on type safety, performance, and user experience.