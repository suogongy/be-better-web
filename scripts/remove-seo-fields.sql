-- Remove SEO-related fields from the database
-- This script removes all SEO functionality from the database schema

-- Remove SEO fields from posts table
ALTER TABLE public.posts
DROP COLUMN IF EXISTS meta_title,
DROP COLUMN IF EXISTS meta_description;

-- Remove categories.slug field (SEO-friendly URLs)
ALTER TABLE public.categories
DROP COLUMN IF EXISTS slug;

-- Remove tags.slug field (SEO-friendly URLs)
ALTER TABLE public.tags
DROP COLUMN IF EXISTS slug;

-- Note: We keep the excerpt field as it's useful for blog post previews
-- Note: We keep the featured_image field as it's useful for blog post display

-- Update comments: removing SEO-related functionality
-- No changes needed as comments don't have SEO fields

-- Update any references in default data
-- Remove slug references from default categories insert
-- This will be handled by updating the insert statements without slug columns

COMMIT;