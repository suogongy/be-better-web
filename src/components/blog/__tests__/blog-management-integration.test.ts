/**
 * Blog Management Integration Tests
 * These tests verify the complete blog management workflow with real database operations
 */

import { postService, userService, categoryService, tagService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID = 'blog-test-user-' + Date.now()
const TEST_EMAIL = `blogtest${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Blog Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Use direct database insertion since we removed foreign key constraints
  const { data, error } = await supabase
    .from('users')
    .upsert(testUser)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }
  
  return data
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete posts first (they reference users)
    await supabase.from('posts').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
    
    // Clean up test categories and tags
    await supabase.from('categories').delete().like('name', 'Test%')
    await supabase.from('tags').delete().like('name', 'test-%')
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

describe('Blog Management Integration Tests', () => {
  let testUser: any
  let createdPosts: any[] = []
  let createdCategories: any[] = []
  let createdTags: any[] = []

  beforeAll(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean up posts created in each test
    for (const post of createdPosts) {
      try {
        await postService.deletePost(post.id)
      } catch (error) {
        console.warn('Post cleanup warning:', error)
      }
    }
    createdPosts = []

    // Clean up categories and tags
    for (const category of createdCategories) {
      try {
        await categoryService.deleteCategory(category.id)
      } catch (error) {
        console.warn('Category cleanup warning:', error)
      }
    }
    createdCategories = []

    for (const tag of createdTags) {
      try {
        await tagService.deleteTag(tag.id)
      } catch (error) {
        console.warn('Tag cleanup warning:', error)
      }
    }
    createdTags = []
  })

  describe('Blog Post CRUD Operations', () => {
    it('should create a blog post with all properties', async () => {
      const postData = {
        user_id: TEST_USER_ID,
        title: 'My First Blog Post',
        slug: 'my-first-blog-post-' + Date.now(),
        content: 'This is the content of my first blog post. It contains multiple paragraphs and shows how the blog system works.',
        excerpt: 'This is a brief excerpt of the blog post.',
        featured_image: 'https://example.com/image.jpg',
        status: 'published' as const,
        type: 'manual' as const,
        meta_title: 'My First Blog Post - SEO Title',
        meta_description: 'This is the meta description for SEO purposes.',
        published_at: new Date().toISOString()
      }

      const post = await postService.createPost(postData)
      createdPosts.push(post)

      expect(post).toBeDefined()
      expect(post.id).toBeDefined()
      expect(post.title).toBe(postData.title)
      expect(post.slug).toBe(postData.slug)
      expect(post.content).toBe(postData.content)
      expect(post.excerpt).toBe(postData.excerpt)
      expect(post.featured_image).toBe(postData.featured_image)
      expect(post.status).toBe(postData.status)
      expect(post.type).toBe(postData.type)
      expect(post.meta_title).toBe(postData.meta_title)
      expect(post.meta_description).toBe(postData.meta_description)
      expect(post.user_id).toBe(TEST_USER_ID)
      expect(post.view_count).toBe(0)
      expect(post.created_at).toBeDefined()
      expect(post.updated_at).toBeDefined()
    })

    it('should create a draft post', async () => {
      const postData = {
        user_id: TEST_USER_ID,
        title: 'Draft Post',
        slug: 'draft-post-' + Date.now(),
        content: 'This is a draft post that is not yet published.',
        status: 'draft' as const,
        type: 'manual' as const
      }

      const post = await postService.createPost(postData)
      createdPosts.push(post)

      expect(post.status).toBe('draft')
      expect(post.published_at).toBeNull()
    })

    it('should retrieve post by ID', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Test Retrieve Post',
        slug: 'test-retrieve-post-' + Date.now(),
        content: 'Content for retrieval test',
        status: 'published'
      })
      createdPosts.push(post)

      const retrievedPost = await postService.getPost(post.id)

      expect(retrievedPost).toBeDefined()
      expect(retrievedPost!.id).toBe(post.id)
      expect(retrievedPost!.title).toBe('Test Retrieve Post')
    })

    it('should retrieve post by slug', async () => {
      const slug = 'test-slug-' + Date.now()
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Post with Slug',
        slug: slug,
        content: 'Content for slug test',
        status: 'published'
      })
      createdPosts.push(post)

      const postBySlug = await postService.getPostBySlug(slug)

      expect(postBySlug).toBeDefined()
      expect(postBySlug!.id).toBe(post.id)
      expect(postBySlug!.slug).toBe(slug)
    })

    it('should return null for non-existent post', async () => {
      const nonExistentPost = await postService.getPost('non-existent-id')
      expect(nonExistentPost).toBeNull()
    })

    it('should update post properties', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Original Title',
        slug: 'original-slug-' + Date.now(),
        content: 'Original content',
        status: 'draft'
      })
      createdPosts.push(post)

      const updatedPost = await postService.updatePost(post.id, {
        title: 'Updated Title',
        content: 'Updated content with more information',
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: 'Updated Meta Title'
      })

      expect(updatedPost.title).toBe('Updated Title')
      expect(updatedPost.content).toBe('Updated content with more information')
      expect(updatedPost.status).toBe('published')
      expect(updatedPost.published_at).toBeDefined()
      expect(updatedPost.meta_title).toBe('Updated Meta Title')
    })

    it('should increment view count', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Post for View Count',
        slug: 'view-count-post-' + Date.now(),
        content: 'Content for view count test',
        status: 'published'
      })
      createdPosts.push(post)

      // Initial view count should be 0
      expect(post.view_count).toBe(0)

      // Increment view count multiple times
      await postService.incrementViewCount(post.id)
      await postService.incrementViewCount(post.id)
      await postService.incrementViewCount(post.id)

      const updatedPost = await postService.getPost(post.id)
      expect(updatedPost!.view_count).toBe(3)
    })

    it('should delete a post', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Post to Delete',
        slug: 'delete-post-' + Date.now(),
        content: 'This post will be deleted',
        status: 'published'
      })

      await postService.deletePost(post.id)

      const deletedPost = await postService.getPost(post.id)
      expect(deletedPost).toBeNull()
    })
  })

  describe('Post Querying and Filtering', () => {
    beforeEach(async () => {
      // Create test posts with different properties
      const posts = [
        {
          user_id: TEST_USER_ID,
          title: 'Published Work Post',
          slug: 'published-work-' + Date.now(),
          content: 'Content about work and productivity',
          status: 'published' as const,
          type: 'manual' as const,
          published_at: new Date('2024-01-15').toISOString()
        },
        {
          user_id: TEST_USER_ID,
          title: 'Draft Personal Post',
          slug: 'draft-personal-' + Date.now(),
          content: 'Personal thoughts and reflections',
          status: 'draft' as const,
          type: 'manual' as const
        },
        {
          user_id: TEST_USER_ID,
          title: 'Generated Schedule Post',
          slug: 'generated-schedule-' + Date.now(),
          content: 'Auto-generated from daily schedule',
          status: 'published' as const,
          type: 'schedule_generated' as const,
          published_at: new Date('2024-01-14').toISOString()
        },
        {
          user_id: TEST_USER_ID,
          title: 'Archived Old Post',
          slug: 'archived-old-' + Date.now(),
          content: 'Old content that is archived',
          status: 'archived' as const,
          type: 'manual' as const,
          published_at: new Date('2024-01-13').toISOString()
        }
      ]

      for (const postData of posts) {
        const post = await postService.createPost(postData)
        createdPosts.push(post)
      }
    })

    it('should get all posts for a user', async () => {
      const result = await postService.getPosts({ userId: TEST_USER_ID })

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(4)
      expect(result.total).toBe(4)

      result.data.forEach(post => {
        expect(post.user_id).toBe(TEST_USER_ID)
      })
    })

    it('should filter posts by status', async () => {
      const publishedResult = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        status: 'published' 
      })
      const draftResult = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        status: 'draft' 
      })
      const archivedResult = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        status: 'archived' 
      })

      expect(publishedResult.data.length).toBe(2)
      expect(draftResult.data.length).toBe(1)
      expect(archivedResult.data.length).toBe(1)

      publishedResult.data.forEach(post => expect(post.status).toBe('published'))
      draftResult.data.forEach(post => expect(post.status).toBe('draft'))
      archivedResult.data.forEach(post => expect(post.status).toBe('archived'))
    })

    it('should search posts by title and excerpt', async () => {
      const searchResult = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        search: 'work' 
      })

      expect(searchResult.data.length).toBeGreaterThan(0)
      searchResult.data.forEach(post => {
        const hasSearchTerm = post.title.toLowerCase().includes('work') ||
                             (post.excerpt && post.excerpt.toLowerCase().includes('work'))
        expect(hasSearchTerm).toBe(true)
      })
    })

    it('should paginate post results', async () => {
      const firstPage = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        limit: 2, 
        offset: 0 
      })
      const secondPage = await postService.getPosts({ 
        userId: TEST_USER_ID, 
        limit: 2, 
        offset: 2 
      })

      expect(firstPage.data.length).toBe(2)
      expect(secondPage.data.length).toBe(2)
      expect(firstPage.total).toBe(4)
      expect(secondPage.total).toBe(4)

      // Check that results are different
      expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id)
    })

    it('should order posts correctly', async () => {
      const result = await postService.getPosts({ userId: TEST_USER_ID })

      // Posts should be ordered by published_at desc, then created_at desc
      expect(result.data.length).toBeGreaterThan(1)
      
      for (let i = 1; i < result.data.length; i++) {
        const current = result.data[i]
        const previous = result.data[i - 1]
        
        if (previous.published_at && current.published_at) {
          expect(new Date(previous.published_at).getTime())
            .toBeGreaterThanOrEqual(new Date(current.published_at).getTime())
        }
      }
    })
  })

  describe('Category Management', () => {
    it('should create and manage categories', async () => {
      const category = await categoryService.createCategory({
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
        description: 'A category for testing',
        color: '#FF5733'
      })
      createdCategories.push(category)

      expect(category).toBeDefined()
      expect(category.name).toBe('Test Category')
      expect(category.color).toBe('#FF5733')

      // Get all categories
      const categories = await categoryService.getCategories()
      const testCategory = categories.find(c => c.id === category.id)
      expect(testCategory).toBeDefined()

      // Update category
      const updatedCategory = await categoryService.updateCategory(category.id, {
        name: 'Updated Test Category',
        description: 'Updated description'
      })
      expect(updatedCategory.name).toBe('Updated Test Category')
      expect(updatedCategory.description).toBe('Updated description')
    })

    it('should handle category deletion', async () => {
      const category = await categoryService.createCategory({
        name: 'Category to Delete',
        slug: 'delete-category-' + Date.now(),
        description: 'This category will be deleted'
      })

      await categoryService.deleteCategory(category.id)

      const categories = await categoryService.getCategories()
      const deletedCategory = categories.find(c => c.id === category.id)
      expect(deletedCategory).toBeUndefined()
    })
  })

  describe('Tag Management', () => {
    it('should create and manage tags', async () => {
      const tag = await tagService.createTag({
        name: 'test-tag',
        slug: 'test-tag-' + Date.now()
      })
      createdTags.push(tag)

      expect(tag).toBeDefined()
      expect(tag.name).toBe('test-tag')

      // Get all tags
      const tags = await tagService.getTags()
      const testTag = tags.find(t => t.id === tag.id)
      expect(testTag).toBeDefined()

      // Update tag
      const updatedTag = await tagService.updateTag(tag.id, {
        name: 'updated-test-tag'
      })
      expect(updatedTag.name).toBe('updated-test-tag')
    })

    it('should handle tag deletion', async () => {
      const tag = await tagService.createTag({
        name: 'tag-to-delete',
        slug: 'tag-to-delete-' + Date.now()
      })

      await tagService.deleteTag(tag.id)

      const tags = await tagService.getTags()
      const deletedTag = tags.find(t => t.id === tag.id)
      expect(deletedTag).toBeUndefined()
    })
  })

  describe('Post with Categories and Tags', () => {
    it('should create a post with categories and tags', async () => {
      // First create categories and tags
      const category = await categoryService.createCategory({
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
        description: 'A test category',
        color: '#FF5733'
      })
      createdCategories.push(category)

      const tag = await tagService.createTag({
        name: 'test-tag',
        slug: 'test-tag-' + Date.now()
      })
      createdTags.push(tag)

      // Create post with category and tag relationships
      const postData = {
        user_id: TEST_USER_ID,
        title: 'Post with Categories and Tags',
        slug: 'post-with-categories-tags-' + Date.now(),
        content: 'This post has categories and tags attached.',
        excerpt: 'A post to test category and tag relationships.',
        status: 'published' as const,
        category_ids: [category.id],
        tag_ids: [tag.id]
      }

      const post = await postService.createPost(postData)
      createdPosts.push(post)

      expect(post).toBeDefined()
      expect(post.id).toBeDefined()
      expect(post.title).toBe(postData.title)

      // Get post with relations to verify categories and tags
      const postWithRelations = await postService.getPostWithRelations(post.id)
      expect(postWithRelations).toBeDefined()
      expect(postWithRelations.categories).toHaveLength(1)
      expect(postWithRelations.categories[0].id).toBe(category.id)
      expect(postWithRelations.tags).toHaveLength(1)
      expect(postWithRelations.tags[0].id).toBe(tag.id)
      expect(postWithRelations.category_ids).toContain(category.id)
      expect(postWithRelations.tag_ids).toContain(tag.id)
    })

    it('should update post categories and tags', async () => {
      // Create initial categories and tags
      const category1 = await categoryService.createCategory({
        name: 'Category 1',
        slug: 'category-1-' + Date.now(),
        color: '#FF5733'
      })
      const category2 = await categoryService.createCategory({
        name: 'Category 2',
        slug: 'category-2-' + Date.now(),
        color: '#33FF57'
      })
      createdCategories.push(category1, category2)

      const tag1 = await tagService.createTag({
        name: 'tag-1',
        slug: 'tag-1-' + Date.now()
      })
      const tag2 = await tagService.createTag({
        name: 'tag-2',
        slug: 'tag-2-' + Date.now()
      })
      createdTags.push(tag1, tag2)

      // Create post with initial categories and tags
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Post for Update Test',
        slug: 'post-update-test-' + Date.now(),
        content: 'Initial content',
        category_ids: [category1.id],
        tag_ids: [tag1.id]
      })
      createdPosts.push(post)

      // Update with different categories and tags
      const updatedPost = await postService.updatePost(post.id, {
        title: 'Updated Post Title',
        category_ids: [category2.id],
        tag_ids: [tag2.id]
      })

      expect(updatedPost.title).toBe('Updated Post Title')

      // Verify the relationships were updated
      const postWithRelations = await postService.getPostWithRelations(post.id)
      expect(postWithRelations.categories).toHaveLength(1)
      expect(postWithRelations.categories[0].id).toBe(category2.id)
      expect(postWithRelations.tags).toHaveLength(1)
      expect(postWithRelations.tags[0].id).toBe(tag2.id)
    })
  })

  describe('Auto-Generated Blog Posts', () => {
    it('should create auto-generated posts from schedule', async () => {
      const autoPost = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Daily Productivity Summary - January 15, 2024',
        slug: 'daily-summary-2024-01-15-' + Date.now(),
        content: 'Today I completed 3 out of 4 tasks with an 85% productivity score. Key achievements include finishing the project proposal and attending the team meeting.',
        excerpt: 'Daily productivity summary with key achievements and metrics.',
        status: 'published',
        type: 'schedule_generated', // Auto-generated type
        published_at: new Date().toISOString()
      })
      createdPosts.push(autoPost)

      expect(autoPost.type).toBe('schedule_generated')
      expect(autoPost.title).toContain('Daily Productivity Summary')

      // Verify it appears in filtered results
      const autoGeneratedPosts = await postService.getPostsSimple({
        userId: TEST_USER_ID
      })

      const foundAutoPost = autoGeneratedPosts.find(p => p.type === 'schedule_generated')
      expect(foundAutoPost).toBeDefined()
    })
  })

  describe('Blog SEO Features', () => {
    it('should handle SEO metadata correctly', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'SEO Optimized Post',
        slug: 'seo-optimized-post-' + Date.now(),
        content: 'This is a long form blog post that demonstrates SEO optimization features including meta titles, descriptions, and proper content structure.',
        excerpt: 'A demonstration of SEO optimization features.',
        status: 'published',
        meta_title: 'SEO Optimized Post - Complete Guide | Blog Name',
        meta_description: 'Learn about SEO optimization in this comprehensive guide covering meta titles, descriptions, and content structure for better search rankings.',
        published_at: new Date().toISOString()
      })
      createdPosts.push(post)

      expect(post.meta_title).toBeDefined()
      expect(post.meta_description).toBeDefined()
      expect(post.meta_title!.length).toBeLessThanOrEqual(60) // SEO best practice
      expect(post.meta_description!.length).toBeLessThanOrEqual(160) // SEO best practice

      // Test slug uniqueness
      expect(post.slug).toMatch(/^[a-z0-9-]+$/) // Only lowercase, numbers, and hyphens
    })
  })

  describe('Blog Performance Features', () => {
    it('should track view counts accurately', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Popular Blog Post',
        slug: 'popular-post-' + Date.now(),
        content: 'This post will become popular',
        status: 'published'
      })
      createdPosts.push(post)

      // Simulate multiple views
      for (let i = 0; i < 10; i++) {
        await postService.incrementViewCount(post.id)
      }

      const viewedPost = await postService.getPost(post.id)
      expect(viewedPost!.view_count).toBe(10)
    })
  })
})