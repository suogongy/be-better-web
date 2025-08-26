/**
 * Comprehensive Database Service Tests
 * These tests verify that all CRUD operations work correctly with the real database
 */

import { 
  userService, 
  postService, 
  categoryService, 
  tagService, 
  taskService, 
  summaryService 
} from '../database'
import { supabase } from '../client'

// Test user ID for testing purposes
const TEST_USER_ID = 'test-user-' + Date.now()
const TEST_EMAIL = `test${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Test User'
  }
  
  return await userService.createProfile(testUser)
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete all test data in reverse dependency order
    await supabase.from('habit_logs').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('habits').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('mood_logs').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('daily_summaries').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('tasks').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('posts').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

describe('Database Service Integration Tests', () => {
  beforeAll(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('User Service', () => {
    it('should create a user profile', async () => {
      const user = await createTestUser()
      
      expect(user).toBeDefined()
      expect(user.id).toBe(TEST_USER_ID)
      expect(user.email).toBe(TEST_EMAIL)
      expect(user.name).toBe('Test User')
    })

    it('should get user profile', async () => {
      const user = await userService.getProfile(TEST_USER_ID)
      
      expect(user).toBeDefined()
      expect(user!.id).toBe(TEST_USER_ID)
      expect(user!.email).toBe(TEST_EMAIL)
    })

    it('should update user profile', async () => {
      const updatedUser = await userService.updateProfile(TEST_USER_ID, {
        name: 'Updated Test User',
        bio: 'Test bio'
      })
      
      expect(updatedUser.name).toBe('Updated Test User')
      expect(updatedUser.bio).toBe('Test bio')
    })

    it('should return null for non-existent user', async () => {
      const user = await userService.getProfile('non-existent-id')
      expect(user).toBeNull()
    })
  })

  describe('Category Service', () => {
    let testCategoryId: string

    it('should create a category', async () => {
      const category = await categoryService.createCategory({
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
        description: 'Test category description',
        color: '#3B82F6'
      })
      
      testCategoryId = category.id
      expect(category).toBeDefined()
      expect(category.name).toBe('Test Category')
      expect(category.color).toBe('#3B82F6')
    })

    it('should get all categories', async () => {
      const categories = await categoryService.getCategories()
      
      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
      
      const testCategory = categories.find(c => c.id === testCategoryId)
      expect(testCategory).toBeDefined()
    })

    it('should update a category', async () => {
      const updatedCategory = await categoryService.updateCategory(testCategoryId, {
        name: 'Updated Test Category',
        description: 'Updated description'
      })
      
      expect(updatedCategory.name).toBe('Updated Test Category')
      expect(updatedCategory.description).toBe('Updated description')
    })

    it('should delete a category', async () => {
      await categoryService.deleteCategory(testCategoryId)
      
      const categories = await categoryService.getCategories()
      const deletedCategory = categories.find(c => c.id === testCategoryId)
      expect(deletedCategory).toBeUndefined()
    })
  })

  describe('Tag Service', () => {
    let testTagId: string

    it('should create a tag', async () => {
      const tag = await tagService.createTag({
        name: 'test-tag',
        slug: 'test-tag-' + Date.now()
      })
      
      testTagId = tag.id
      expect(tag).toBeDefined()
      expect(tag.name).toBe('test-tag')
    })

    it('should get all tags', async () => {
      const tags = await tagService.getTags()
      
      expect(tags).toBeDefined()
      expect(Array.isArray(tags)).toBe(true)
      
      const testTag = tags.find(t => t.id === testTagId)
      expect(testTag).toBeDefined()
    })

    it('should update a tag', async () => {
      const updatedTag = await tagService.updateTag(testTagId, {
        name: 'updated-test-tag'
      })
      
      expect(updatedTag.name).toBe('updated-test-tag')
    })

    it('should delete a tag', async () => {
      await tagService.deleteTag(testTagId)
      
      const tags = await tagService.getTags()
      const deletedTag = tags.find(t => t.id === testTagId)
      expect(deletedTag).toBeUndefined()
    })
  })

  describe('Post Service', () => {
    let testPostId: string

    beforeAll(async () => {
      // Ensure test user exists
      await createTestUser()
    })

    it('should create a post', async () => {
      const post = await postService.createPost({
        user_id: TEST_USER_ID,
        title: 'Test Post',
        slug: 'test-post-' + Date.now(),
        content: 'This is a test post content.',
        excerpt: 'Test excerpt',
        status: 'published',
        type: 'manual'
      })
      
      testPostId = post.id
      expect(post).toBeDefined()
      expect(post.title).toBe('Test Post')
      expect(post.user_id).toBe(TEST_USER_ID)
      expect(post.status).toBe('published')
    })

    it('should get posts by user', async () => {
      const result = await postService.getPosts({ userId: TEST_USER_ID })
      
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.total).toBeGreaterThan(0)
      
      const testPost = result.data.find(p => p.id === testPostId)
      expect(testPost).toBeDefined()
    })

    it('should get post by ID', async () => {
      const post = await postService.getPost(testPostId)
      
      expect(post).toBeDefined()
      expect(post!.id).toBe(testPostId)
      expect(post!.title).toBe('Test Post')
    })

    it('should get post by slug', async () => {
      const post = await postService.getPost(testPostId)
      const postBySlug = await postService.getPostBySlug(post!.slug)
      
      expect(postBySlug).toBeDefined()
      expect(postBySlug!.id).toBe(testPostId)
    })

    it('should update a post', async () => {
      const updatedPost = await postService.updatePost(testPostId, {
        title: 'Updated Test Post',
        content: 'Updated content'
      })
      
      expect(updatedPost.title).toBe('Updated Test Post')
      expect(updatedPost.content).toBe('Updated content')
    })

    it('should increment view count', async () => {
      const initialPost = await postService.getPost(testPostId)
      const initialViewCount = initialPost!.view_count || 0
      
      await postService.incrementViewCount(testPostId)
      
      const updatedPost = await postService.getPost(testPostId)
      expect(updatedPost!.view_count).toBe(initialViewCount + 1)
    })

    it('should delete a post', async () => {
      await postService.deletePost(testPostId)
      
      const deletedPost = await postService.getPost(testPostId)
      expect(deletedPost).toBeNull()
    })
  })

  describe('Task Service', () => {
    let testTaskId: string

    beforeAll(async () => {
      // Ensure test user exists
      await createTestUser()
    })

    it('should create a task', async () => {
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Test Task',
        description: 'Test task description',
        category: 'Work',
        priority: 'high',
        estimated_minutes: 60,
        due_date: '2024-12-31'
      })
      
      testTaskId = task.id
      expect(task).toBeDefined()
      expect(task.title).toBe('Test Task')
      expect(task.user_id).toBe(TEST_USER_ID)
      expect(task.priority).toBe('high')
      expect(task.status).toBe('pending')
    })

    it('should get tasks by user', async () => {
      const tasks = await taskService.getTasks(TEST_USER_ID)
      
      expect(tasks).toBeDefined()
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThan(0)
      
      const testTask = tasks.find(t => t.id === testTaskId)
      expect(testTask).toBeDefined()
    })

    it('should get task by ID', async () => {
      const task = await taskService.getTaskById(testTaskId, TEST_USER_ID)
      
      expect(task).toBeDefined()
      expect(task!.id).toBe(testTaskId)
      expect(task!.title).toBe('Test Task')
    })

    it('should get task categories', async () => {
      const categories = await taskService.getTaskCategories(TEST_USER_ID)
      
      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories).toContain('Work')
    })

    it('should update a task', async () => {
      const updatedTask = await taskService.updateTask(testTaskId, {
        title: 'Updated Test Task',
        status: 'in_progress',
        progress: 50
      })
      
      expect(updatedTask.title).toBe('Updated Test Task')
      expect(updatedTask.status).toBe('in_progress')
      expect(updatedTask.progress).toBe(50)
    })

    it('should complete a task', async () => {
      const completedTask = await taskService.completeTask(testTaskId, {
        actual_minutes: 45,
        completion_notes: 'Task completed successfully'
      })
      
      expect(completedTask.status).toBe('completed')
      expect(completedTask.progress).toBe(100)
      expect(completedTask.actual_minutes).toBe(45)
      expect(completedTask.completion_notes).toBe('Task completed successfully')
      expect(completedTask.completed_at).toBeDefined()
    })

    it('should get task statistics', async () => {
      const stats = await taskService.getTaskStats(TEST_USER_ID)
      
      expect(stats).toBeDefined()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.completed).toBeGreaterThan(0)
      expect(stats.completionRate).toBeGreaterThan(0)
      expect(typeof stats.avgCompletionTime).toBe('number')
    })

    it('should duplicate a task', async () => {
      const duplicatedTask = await taskService.duplicateTask(testTaskId, TEST_USER_ID)
      
      expect(duplicatedTask).toBeDefined()
      expect(duplicatedTask.title).toContain('(Copy)')
      expect(duplicatedTask.status).toBe('pending')
      expect(duplicatedTask.progress).toBe(0)
      expect(duplicatedTask.user_id).toBe(TEST_USER_ID)
    })

    it('should delete a task', async () => {
      await taskService.deleteTask(testTaskId)
      
      const deletedTask = await taskService.getTaskById(testTaskId, TEST_USER_ID)
      expect(deletedTask).toBeNull()
    })
  })

  describe('Summary Service', () => {
    const testDate = '2024-01-15'
    let createdTask: any

    beforeAll(async () => {
      // Ensure test user exists
      await createTestUser()
      
      // Create a task for the test date
      createdTask = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Summary Test Task',
        estimated_minutes: 60,
        due_date: testDate,
        status: 'completed'
      })
    })

    it('should generate daily summary', async () => {
      const summary = await summaryService.generateDailySummary(TEST_USER_ID, testDate)
      
      expect(summary).toBeDefined()
      expect(summary.user_id).toBe(TEST_USER_ID)
      expect(summary.summary_date).toBe(testDate)
      expect(summary.total_tasks).toBeGreaterThan(0)
      expect(summary.completion_rate).toBeDefined()
      expect(summary.productivity_score).toBeDefined()
    })

    it('should get daily summary', async () => {
      const summary = await summaryService.getSummary(TEST_USER_ID, testDate)
      
      expect(summary).toBeDefined()
      expect(summary!.summary_date).toBe(testDate)
    })

    it('should update daily summary', async () => {
      const updatedSummary = await summaryService.updateSummary(TEST_USER_ID, testDate, {
        mood_rating: 4,
        energy_rating: 3,
        notes: 'Test summary notes',
        achievements: ['Completed test task'],
        challenges: ['Time management'],
        tomorrow_goals: ['Start new project']
      })
      
      expect(updatedSummary.mood_rating).toBe(4)
      expect(updatedSummary.energy_rating).toBe(3)
      expect(updatedSummary.notes).toBe('Test summary notes')
      expect(updatedSummary.achievements).toEqual(['Completed test task'])
    })

    it('should get summaries with date range', async () => {
      const summaries = await summaryService.getSummaries(TEST_USER_ID, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 10
      })
      
      expect(summaries).toBeDefined()
      expect(Array.isArray(summaries)).toBe(true)
      
      const testSummary = summaries.find(s => s.summary_date === testDate)
      expect(testSummary).toBeDefined()
    })

    it('should get productivity trends', async () => {
      const trends = await summaryService.getProductivityTrends(TEST_USER_ID, 30)
      
      expect(trends).toBeDefined()
      expect(trends.daily).toBeDefined()
      expect(Array.isArray(trends.daily)).toBe(true)
      expect(trends.averages).toBeDefined()
      expect(typeof trends.averages.avg_completion_rate).toBe('number')
      expect(typeof trends.averages.avg_productivity_score).toBe('number')
    })

    it('should delete daily summary', async () => {
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
      
      const deletedSummary = await summaryService.getSummary(TEST_USER_ID, testDate)
      expect(deletedSummary).toBeNull()
    })

    afterAll(async () => {
      // Clean up created task
      if (createdTask) {
        await taskService.deleteTask(createdTask.id)
      }
    })
  })
})