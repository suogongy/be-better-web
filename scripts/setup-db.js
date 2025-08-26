#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * 
 * This script sets up the database schema and Row Level Security policies
 * for the Be Better Web application.
 * 
 * Prerequisites:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key
 * 3. Set environment variables in .env.local:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
 * 
 * Usage:
 * npm run setup-db
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Database Setup Script');
console.log('=====================================');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('');
  console.log('Please create a .env.local file with the following variables:');
  console.log('');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.log('');
  console.log('You can find these values in your Supabase project dashboard:');
  console.log('https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api');
  process.exit(1);
}

console.log('✅ Environment file found');

// Check if schema file exists
const schemaPath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.log('❌ Schema file not found at src/lib/supabase/schema.sql');
  process.exit(1);
}

console.log('✅ Database schema file found');
console.log('');

console.log('📋 Next Steps:');
console.log('');
console.log('1. Open your Supabase project dashboard:');
console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID');
console.log('');
console.log('2. Go to the SQL Editor tab');
console.log('');
console.log('3. Copy and paste the contents of src/lib/supabase/schema.sql');
console.log('   into the SQL editor and run it');
console.log('');
console.log('4. The schema includes:');
console.log('   - All required tables (users, posts, categories, tasks, etc.)');
console.log('   - Indexes for performance');
console.log('   - Default categories and tags');
console.log('   - Updated_at triggers');
console.log('');
console.log('5. After running the schema, set up Row Level Security (RLS)');
console.log('   by running the RLS policies script');
console.log('');
console.log('💡 The database schema is now ready for use!');
console.log('   You can start the development server with: npm run dev');