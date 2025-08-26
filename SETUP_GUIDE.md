# Setup Guide - Be Better Web

## Quick Start

The application is now running successfully! However, to use all features, you'll need to configure Supabase.

## Current Status ✅

**Fixed Issues:**
- ✅ Turbopack/Babel conflict resolved
- ✅ Runtime errors eliminated
- ✅ Server starts successfully
- ✅ All components render properly
- ✅ Tests pass successfully

## Supabase Configuration (Optional)

To enable full functionality including user authentication, database features, and data persistence:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### 2. Update Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```env
# Replace with your actual Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Replace with your actual Supabase anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Replace with your service role key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set Up Database Schema

Run the database migration scripts in your Supabase dashboard:

1. Go to SQL Editor in your Supabase dashboard
2. Run the schema files from `src/lib/supabase/schema.sql` and `src/lib/supabase/schema-advanced.sql`

## Running Without Supabase

The application will run in "demo mode" without Supabase configuration:
- ⚠️ No user authentication
- ⚠️ No data persistence
- ✅ All UI components work
- ✅ Guest access available
- ✅ Blog viewing works

## Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Access the Application

- **Local**: http://localhost:3000
- **Network**: http://your-ip:3000

## Features Available

### Without Supabase Configuration:
- ✅ Homepage and navigation
- ✅ Static blog viewing
- ✅ UI components and themes
- ✅ Responsive design

### With Supabase Configuration:
- ✅ User authentication
- ✅ Personal dashboard
- ✅ Task management
- ✅ Habit tracking
- ✅ Mood logging
- ✅ Blog creation and editing
- ✅ Data persistence
- ✅ Productivity analytics

## Troubleshooting

### If you see "Supabase not configured" warnings:
1. Check your `.env.local` file
2. Ensure environment variables are properly set
3. Restart the development server

### If the server won't start:
1. Stop all Node.js processes
2. Delete the `.next` directory
3. Run `npm run dev` again

## Next Steps

1. Configure Supabase for full functionality
2. Customize the application for your needs
3. Deploy to your preferred platform (Vercel, Netlify, etc.)

The application is production-ready and fully functional! 🎉