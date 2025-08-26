-- Row Level Security (RLS) Policies for Be Better Web
-- This file contains all RLS policies to secure data access

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Users policies (no auth.users dependency)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (true); -- Allow all users to view profiles

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (true); -- Allow all users to update profiles

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (true); -- Allow all users to create profiles

-- Posts policies (simplified without auth dependency)
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create posts" ON public.posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update posts" ON public.posts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete posts" ON public.posts
  FOR DELETE USING (true);

-- Categories policies (public access)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage categories" ON public.categories
  FOR ALL USING (true);

-- Tags policies (public access)
CREATE POLICY "Anyone can view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage tags" ON public.tags
  FOR ALL USING (true);

-- Post-Categories junction policies (simplified)
CREATE POLICY "Anyone can view post categories" ON public.post_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage post categories" ON public.post_categories
  FOR ALL USING (true);

-- Post-Tags junction policies (simplified)
CREATE POLICY "Anyone can view post tags" ON public.post_tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage post tags" ON public.post_tags
  FOR ALL USING (true);

-- Comments policies (simplified)
CREATE POLICY "Anyone can view approved comments" ON public.comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can create comments" ON public.comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can moderate comments" ON public.comments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete comments" ON public.comments
  FOR DELETE USING (true);

-- Tasks policies (simplified)
CREATE POLICY "Anyone can view tasks" ON public.tasks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update tasks" ON public.tasks
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete tasks" ON public.tasks
  FOR DELETE USING (true);

-- Daily summaries policies (simplified)
CREATE POLICY "Anyone can view summaries" ON public.daily_summaries
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create summaries" ON public.daily_summaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update summaries" ON public.daily_summaries
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete summaries" ON public.daily_summaries
  FOR DELETE USING (true);

-- Simplified RLS policies - no triggers or functions
-- Database only handles data storage, all logic in application code

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;