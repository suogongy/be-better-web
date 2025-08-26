/**
 * Task Management Integration Tests
 * These tests verify the complete task management workflow with real database operations
 */

import { taskService, userService, summaryService } from '@/lib/supabase/database'
import { supabase } from '@/lib/supabase/client'

// Test user ID for testing purposes
const TEST_USER_ID = 'task-test-user-' + Date.now()
const TEST_EMAIL = `tasktest${Date.now()}@example.com`

// Helper function to create a test user
async function createTestUser() {
  const testUser = {
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Task Test User'
  }
  
  return await userService.createProfile(testUser)
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    await supabase.from('daily_summaries').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('tasks').delete().eq('user_id', TEST_USER_ID)
    await supabase.from('users').delete().eq('id', TEST_USER_ID)
  } catch (error) {
    console.warn('Cleanup warning:', error)
  }
}

describe('Task Management Integration Tests', () => {
  let testUser: any
  let createdTasks: any[] = []

  beforeAll(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean up tasks created in each test
    for (const task of createdTasks) {
      try {
        await taskService.deleteTask(task.id)
      } catch (error) {
        console.warn('Task cleanup warning:', error)
      }
    }
    createdTasks = []
  })

  describe('Basic Task CRUD Operations', () => {
    it('should create a new task with all properties', async () => {
      const taskData = {
        user_id: TEST_USER_ID,
        title: 'Complete project proposal',
        description: 'Write and submit the Q1 project proposal',
        category: 'Work',
        priority: 'high' as const,
        estimated_minutes: 120,
        due_date: '2024-12-31',
        due_time: '15:00',
        is_recurring: false
      }

      const task = await taskService.createTask(taskData)
      createdTasks.push(task)

      expect(task).toBeDefined()
      expect(task.id).toBeDefined()
      expect(task.title).toBe(taskData.title)
      expect(task.description).toBe(taskData.description)
      expect(task.category).toBe(taskData.category)
      expect(task.priority).toBe(taskData.priority)
      expect(task.status).toBe('pending')
      expect(task.progress).toBe(0)
      expect(task.estimated_minutes).toBe(taskData.estimated_minutes)
      expect(task.due_date).toBe(taskData.due_date)
      expect(task.user_id).toBe(TEST_USER_ID)
      expect(task.created_at).toBeDefined()
      expect(task.updated_at).toBeDefined()
    })

    it('should retrieve task by ID', async () => {
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Test retrieve task',
        category: 'Personal'
      })
      createdTasks.push(task)

      const retrievedTask = await taskService.getTaskById(task.id, TEST_USER_ID)

      expect(retrievedTask).toBeDefined()
      expect(retrievedTask!.id).toBe(task.id)
      expect(retrievedTask!.title).toBe('Test retrieve task')
    })

    it('should return null for non-existent task', async () => {
      const nonExistentTask = await taskService.getTaskById('non-existent-id', TEST_USER_ID)
      expect(nonExistentTask).toBeNull()
    })

    it('should update task properties', async () => {
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Original title',
        priority: 'low' as const
      })
      createdTasks.push(task)

      const updatedTask = await taskService.updateTask(task.id, {
        title: 'Updated title',
        description: 'Added description',
        priority: 'high',
        status: 'in_progress',
        progress: 50,
        actual_minutes: 30
      })

      expect(updatedTask.title).toBe('Updated title')
      expect(updatedTask.description).toBe('Added description')
      expect(updatedTask.priority).toBe('high')
      expect(updatedTask.status).toBe('in_progress')
      expect(updatedTask.progress).toBe(50)
      expect(updatedTask.actual_minutes).toBe(30)
    })

    it('should complete a task with completion data', async () => {
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Task to complete',
        estimated_minutes: 60
      })
      createdTasks.push(task)

      const completedTask = await taskService.completeTask(task.id, {
        actual_minutes: 45,
        completion_notes: 'Completed ahead of schedule'
      })

      expect(completedTask.status).toBe('completed')
      expect(completedTask.progress).toBe(100)
      expect(completedTask.actual_minutes).toBe(45)
      expect(completedTask.completion_notes).toBe('Completed ahead of schedule')
      expect(completedTask.completed_at).toBeDefined()
      expect(new Date(completedTask.completed_at!).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should delete a task', async () => {
      const task = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Task to delete'
      })

      await taskService.deleteTask(task.id)

      const deletedTask = await taskService.getTaskById(task.id, TEST_USER_ID)
      expect(deletedTask).toBeNull()
    })
  })

  describe('Task Filtering and Querying', () => {
    beforeEach(async () => {
      // Create test tasks with different properties
      const tasks = [
        {
          user_id: TEST_USER_ID,
          title: 'High priority work task',
          category: 'Work',
          priority: 'high' as const,
          status: 'pending' as const,
          due_date: '2024-12-31'
        },
        {
          user_id: TEST_USER_ID,
          title: 'Medium priority personal task',
          category: 'Personal',
          priority: 'medium' as const,
          status: 'in_progress' as const,
          due_date: '2024-12-30'
        },
        {
          user_id: TEST_USER_ID,
          title: 'Completed work task',
          category: 'Work',
          priority: 'low' as const,
          status: 'completed' as const,
          due_date: '2024-12-29'
        }
      ]

      for (const taskData of tasks) {
        const task = await taskService.createTask(taskData)
        createdTasks.push(task)
      }
    })

    it('should filter tasks by status', async () => {
      const pendingTasks = await taskService.getTasks(TEST_USER_ID, { status: 'pending' })
      const inProgressTasks = await taskService.getTasks(TEST_USER_ID, { status: 'in_progress' })
      const completedTasks = await taskService.getTasks(TEST_USER_ID, { status: 'completed' })

      expect(pendingTasks.length).toBeGreaterThan(0)
      expect(inProgressTasks.length).toBeGreaterThan(0)
      expect(completedTasks.length).toBeGreaterThan(0)

      pendingTasks.forEach(task => expect(task.status).toBe('pending'))
      inProgressTasks.forEach(task => expect(task.status).toBe('in_progress'))
      completedTasks.forEach(task => expect(task.status).toBe('completed'))
    })

    it('should filter tasks by category', async () => {
      const workTasks = await taskService.getTasks(TEST_USER_ID, { category: 'Work' })
      const personalTasks = await taskService.getTasks(TEST_USER_ID, { category: 'Personal' })

      expect(workTasks.length).toBeGreaterThan(0)
      expect(personalTasks.length).toBeGreaterThan(0)

      workTasks.forEach(task => expect(task.category).toBe('Work'))
      personalTasks.forEach(task => expect(task.category).toBe('Personal'))
    })

    it('should filter tasks by priority', async () => {
      const highPriorityTasks = await taskService.getTasks(TEST_USER_ID, { priority: 'high' })
      const mediumPriorityTasks = await taskService.getTasks(TEST_USER_ID, { priority: 'medium' })
      const lowPriorityTasks = await taskService.getTasks(TEST_USER_ID, { priority: 'low' })

      expect(highPriorityTasks.length).toBeGreaterThan(0)
      expect(mediumPriorityTasks.length).toBeGreaterThan(0)
      expect(lowPriorityTasks.length).toBeGreaterThan(0)

      highPriorityTasks.forEach(task => expect(task.priority).toBe('high'))
      mediumPriorityTasks.forEach(task => expect(task.priority).toBe('medium'))
      lowPriorityTasks.forEach(task => expect(task.priority).toBe('low'))
    })

    it('should filter tasks by date', async () => {
      const tasksFor31st = await taskService.getTasks(TEST_USER_ID, { date: '2024-12-31' })
      const tasksFor30th = await taskService.getTasks(TEST_USER_ID, { date: '2024-12-30' })

      expect(tasksFor31st.length).toBeGreaterThan(0)
      expect(tasksFor30th.length).toBeGreaterThan(0)

      tasksFor31st.forEach(task => expect(task.due_date).toBe('2024-12-31'))
      tasksFor30th.forEach(task => expect(task.due_date).toBe('2024-12-30'))
    })

    it('should search tasks by title and description', async () => {
      const searchResults = await taskService.getTasks(TEST_USER_ID, { search: 'priority' })

      expect(searchResults.length).toBeGreaterThan(0)
      searchResults.forEach(task => {
        const hasSearchTerm = task.title.toLowerCase().includes('priority') ||
                             (task.description && task.description.toLowerCase().includes('priority'))
        expect(hasSearchTerm).toBe(true)
      })
    })

    it('should sort tasks by different criteria', async () => {
      // Test priority sorting (high -> medium -> low)
      const tasksByPriority = await taskService.getTasks(TEST_USER_ID, { 
        sortBy: 'priority', 
        sortOrder: 'desc' 
      })

      expect(tasksByPriority.length).toBeGreaterThan(2)
      // First task should be high priority
      expect(tasksByPriority[0].priority).toBe('high')

      // Test date sorting
      const tasksByDate = await taskService.getTasks(TEST_USER_ID, { 
        sortBy: 'due_date', 
        sortOrder: 'asc' 
      })

      expect(tasksByDate.length).toBeGreaterThan(1)
      for (let i = 1; i < tasksByDate.length; i++) {
        if (tasksByDate[i-1].due_date && tasksByDate[i].due_date) {
          expect(tasksByDate[i-1].due_date).toBeLessThanOrEqual(tasksByDate[i].due_date)
        }
      }
    })

    it('should limit and paginate task results', async () => {
      const firstPage = await taskService.getTasks(TEST_USER_ID, { 
        limit: 2, 
        offset: 0 
      })
      const secondPage = await taskService.getTasks(TEST_USER_ID, { 
        limit: 2, 
        offset: 2 
      })

      expect(firstPage.length).toBeLessThanOrEqual(2)
      expect(secondPage.length).toBeLessThanOrEqual(2)

      // Check that results are different (if we have enough data)
      if (firstPage.length > 0 && secondPage.length > 0) {
        expect(firstPage[0].id).not.toBe(secondPage[0].id)
      }
    })
  })

  describe('Task Statistics and Analytics', () => {
    beforeEach(async () => {
      // Create tasks with different statuses for statistics
      const tasks = [
        { title: 'Completed task 1', status: 'completed' as const, actual_minutes: 30 },
        { title: 'Completed task 2', status: 'completed' as const, actual_minutes: 45 },
        { title: 'Pending task 1', status: 'pending' as const },
        { title: 'Pending task 2', status: 'pending' as const },
        { title: 'In progress task', status: 'in_progress' as const },
        { title: 'Cancelled task', status: 'cancelled' as const }
      ]

      for (const taskData of tasks) {
        const task = await taskService.createTask({
          user_id: TEST_USER_ID,
          ...taskData
        })
        createdTasks.push(task)
      }
    })

    it('should get accurate task statistics', async () => {
      const stats = await taskService.getTaskStats(TEST_USER_ID)

      expect(stats).toBeDefined()
      expect(stats.total).toBe(6)
      expect(stats.completed).toBe(2)
      expect(stats.pending).toBe(2)
      expect(stats.inProgress).toBe(1)
      expect(stats.cancelled).toBe(1)
      expect(stats.completionRate).toBeCloseTo(33.33, 1) // 2/6 * 100
      expect(stats.avgCompletionTime).toBeCloseTo(37.5, 1) // (30 + 45) / 2
    })

    it('should get task categories for user', async () => {
      // Create tasks with different categories
      await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Work task',
        category: 'Work'
      })
      await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Personal task',
        category: 'Personal'
      })
      createdTasks.push(...[await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Work task',
        category: 'Work'
      }), await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Personal task',
        category: 'Personal'
      })])

      const categories = await taskService.getTaskCategories(TEST_USER_ID)

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories).toContain('Work')
      expect(categories).toContain('Personal')
    })
  })

  describe('Advanced Task Operations', () => {
    it('should duplicate a task correctly', async () => {
      const originalTask = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Original task',
        description: 'Original description',
        category: 'Work',
        priority: 'high',
        estimated_minutes: 60,
        due_date: '2024-12-31',
        status: 'completed',
        progress: 100,
        actual_minutes: 55,
        completion_notes: 'Completed successfully'
      })
      createdTasks.push(originalTask)

      const duplicatedTask = await taskService.duplicateTask(originalTask.id, TEST_USER_ID)
      createdTasks.push(duplicatedTask)

      expect(duplicatedTask).toBeDefined()
      expect(duplicatedTask.id).not.toBe(originalTask.id)
      expect(duplicatedTask.title).toBe('Original task (Copy)')
      expect(duplicatedTask.description).toBe(originalTask.description)
      expect(duplicatedTask.category).toBe(originalTask.category)
      expect(duplicatedTask.priority).toBe(originalTask.priority)
      expect(duplicatedTask.estimated_minutes).toBe(originalTask.estimated_minutes)
      expect(duplicatedTask.due_date).toBe(originalTask.due_date)
      
      // Reset fields
      expect(duplicatedTask.status).toBe('pending')
      expect(duplicatedTask.progress).toBe(0)
      expect(duplicatedTask.actual_minutes).toBeUndefined()
      expect(duplicatedTask.completion_notes).toBeUndefined()
      expect(duplicatedTask.completed_at).toBeUndefined()
    })

    it('should batch update multiple tasks', async () => {
      const tasks = []
      for (let i = 0; i < 3; i++) {
        const task = await taskService.createTask({
          user_id: TEST_USER_ID,
          title: `Batch task ${i + 1}`,
          category: 'Old Category',
          priority: 'low'
        })
        tasks.push(task)
        createdTasks.push(task)
      }

      const taskIds = tasks.map(t => t.id)
      const updatedTasks = await taskService.batchUpdateTasks(taskIds, {
        category: 'New Category',
        priority: 'high',
        status: 'in_progress'
      })

      expect(updatedTasks).toBeDefined()
      expect(updatedTasks.length).toBe(3)

      updatedTasks.forEach(task => {
        expect(task.category).toBe('New Category')
        expect(task.priority).toBe('high')
        expect(task.status).toBe('in_progress')
      })
    })
  })

  describe('Task and Summary Integration', () => {
    it('should generate daily summary from tasks', async () => {
      const testDate = '2024-01-15'
      
      // Create tasks for specific date
      const tasks = [
        {
          user_id: TEST_USER_ID,
          title: 'Morning task',
          estimated_minutes: 60,
          due_date: testDate,
          status: 'completed' as const,
          actual_minutes: 50
        },
        {
          user_id: TEST_USER_ID,
          title: 'Afternoon task',
          estimated_minutes: 90,
          due_date: testDate,
          status: 'completed' as const,
          actual_minutes: 85
        },
        {
          user_id: TEST_USER_ID,
          title: 'Evening task',
          estimated_minutes: 30,
          due_date: testDate,
          status: 'pending' as const
        }
      ]

      for (const taskData of tasks) {
        const task = await taskService.createTask(taskData)
        createdTasks.push(task)
      }

      // Generate summary
      const summary = await summaryService.generateDailySummary(TEST_USER_ID, testDate)

      expect(summary).toBeDefined()
      expect(summary.user_id).toBe(TEST_USER_ID)
      expect(summary.summary_date).toBe(testDate)
      expect(summary.total_tasks).toBe(3)
      expect(summary.completed_tasks).toBe(2)
      expect(summary.completion_rate).toBeCloseTo(66.67, 1) // 2/3 * 100
      expect(summary.total_planned_time).toBe(180) // 60 + 90 + 30
      expect(summary.total_actual_time).toBe(135) // 50 + 85
      expect(summary.productivity_score).toBeGreaterThan(0)

      // Clean up summary
      await summaryService.deleteSummary(TEST_USER_ID, testDate)
    })
  })

  describe('Recurring Tasks', () => {
    it('should create recurring tasks correctly', async () => {
      const baseTask = await taskService.createTask({
        user_id: TEST_USER_ID,
        title: 'Daily Exercise',
        description: 'Do morning workout',
        category: 'Health',
        estimated_minutes: 30,
        due_date: '2024-01-01',
        is_recurring: true,
        recurrence_pattern: {
          type: 'daily',
          interval: 1,
          maxOccurrences: 7
        }
      })
      createdTasks.push(baseTask)

      const recurringTasks = await taskService.generateRecurringTasks(
        TEST_USER_ID,
        baseTask,
        baseTask.recurrence_pattern,
        new Date('2024-01-07')
      )

      expect(recurringTasks).toBeDefined()
      expect(recurringTasks.length).toBeGreaterThan(0)
      expect(recurringTasks.length).toBeLessThanOrEqual(7)

      recurringTasks.forEach(task => {
        expect(task.title).toBe('Daily Exercise')
        expect(task.description).toBe('Do morning workout')
        expect(task.category).toBe('Health')
        expect(task.estimated_minutes).toBe(30)
        expect(task.status).toBe('pending')
        expect(task.is_recurring).toBe(false) // Individual instances are not recurring
        expect(task.due_date).toBeDefined()
      })

      // Clean up recurring tasks
      for (const task of recurringTasks) {
        await taskService.deleteTask(task.id)
      }
    })
  })
})