import React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuth?: {
    user?: any
    loading?: boolean
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialAuth = { user: null, loading: false },
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  // For testing, we'll use a simple wrapper that doesn't require complex providers
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    // This is a simplified test wrapper
    return children as React.ReactElement
  }

  return render(ui, { wrapper: TestWrapper, ...renderOptions })
}

// Test data generators
export const testDataGenerators = {
  createUser: (overrides = {}) => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createTask: (overrides = {}) => ({
    id: 'task-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    title: 'Test Task',
    description: 'Test Description',
    category: 'Work',
    priority: 'medium' as const,
    status: 'pending' as const,
    progress: 0,
    estimated_minutes: 60,
    due_date: '2023-12-31',
    is_recurring: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createHabit: (overrides = {}) => ({
    id: 'habit-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    name: 'Test Habit',
    description: 'Test habit description',
    frequency: 'daily' as const,
    target_count: 1,
    color: '#3B82F6',
    icon: 'circle',
    is_active: true,
    streak_count: 0,
    best_streak: 0,
    reminder_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createPost: (overrides = {}) => ({
    id: 'post-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    title: 'Test Post',
    slug: 'test-post-' + Math.random().toString(36).substr(2, 9),
    content: 'Test content for the blog post.',
    excerpt: 'Test excerpt',
    status: 'published' as const,
    type: 'manual' as const,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    ...overrides,
  }),

  createSummary: (overrides = {}) => ({
    id: 'summary-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    summary_date: new Date().toISOString().split('T')[0],
    total_tasks: 5,
    completed_tasks: 3,
    completion_rate: 60,
    productivity_score: 75,
    mood_rating: 4,
    energy_rating: 3,
    notes: 'Test summary notes',
    achievements: ['Completed important task'],
    challenges: ['Time management'],
    tomorrow_goals: ['Start new project'],
    auto_blog_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMoodLog: (overrides = {}) => ({
    id: 'mood-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    log_date: new Date().toISOString().split('T')[0],
    log_time: new Date().toTimeString().split(' ')[0],
    mood_rating: 7,
    energy_level: 6,
    stress_level: 4,
    sleep_quality: 8,
    notes: 'Feeling good today',
    tags: ['work', 'exercise'],
    created_at: new Date().toISOString(),
    ...overrides,
  }),
}

// Service mocking utilities
export const serviceMocks = {
  createTaskServiceMock: () => ({
    getTasks: jest.fn().mockResolvedValue([]),
    createTask: jest.fn().mockResolvedValue(testDataGenerators.createTask()),
    updateTask: jest.fn().mockResolvedValue(testDataGenerators.createTask()),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    completeTask: jest.fn().mockResolvedValue(testDataGenerators.createTask({ status: 'completed' })),
    getTaskCategories: jest.fn().mockResolvedValue(['Work', 'Personal']),
  }),

  createHabitServiceMock: () => ({
    getHabits: jest.fn().mockResolvedValue([]),
    createHabit: jest.fn().mockResolvedValue(testDataGenerators.createHabit()),
    updateHabit: jest.fn().mockResolvedValue(testDataGenerators.createHabit()),
    deleteHabit: jest.fn().mockResolvedValue(undefined),
    logHabit: jest.fn().mockResolvedValue({}),
    getHabitStats: jest.fn().mockResolvedValue({
      total_habits: 5,
      active_habits: 4,
      completed_today: 2,
      longest_streak: 15,
      completion_rate: 80,
    }),
  }),

  createSummaryServiceMock: () => ({
    getSummaries: jest.fn().mockResolvedValue([]),
    getSummary: jest.fn().mockResolvedValue(null),
    createSummary: jest.fn().mockResolvedValue(testDataGenerators.createSummary()),
    updateSummary: jest.fn().mockResolvedValue(testDataGenerators.createSummary()),
    generateDailySummary: jest.fn().mockResolvedValue(testDataGenerators.createSummary()),
    getProductivityTrends: jest.fn().mockResolvedValue({ daily: [], averages: {} }),
    getWeeklyInsights: jest.fn().mockResolvedValue({}),
  }),

  createPostServiceMock: () => ({
    getPosts: jest.fn().mockResolvedValue([]),
    getPost: jest.fn().mockResolvedValue(null),
    createPost: jest.fn().mockResolvedValue(testDataGenerators.createPost()),
    updatePost: jest.fn().mockResolvedValue(testDataGenerators.createPost()),
    deletePost: jest.fn().mockResolvedValue(undefined),
    incrementViewCount: jest.fn().mockResolvedValue(undefined),
  }),
}

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = !isNaN(Date.parse(received))
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      }
    }
  },

  toHaveValidId(received) {
    const pass = typeof received === 'string' && received.length > 0
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ID`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid ID`,
        pass: false,
      }
    }
  },
})

// Test helpers
export const testHelpers = {
  // Wait for async operations
  waitFor: (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create a mock function with implementation
  createMockFn: <T extends (...args: any[]) => any>(implementation?: T) => {
    const mockFn = jest.fn()
    if (implementation) {
      mockFn.mockImplementation(implementation)
    }
    return mockFn as jest.MockedFunction<T>
  },

  // Create a promise that can be resolved/rejected manually
  createControllablePromise: <T>() => {
    let resolve: (value: T) => void
    let reject: (reason?: any) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve: resolve!, reject: reject! }
  },

  // Simulate user interactions
  simulateFormSubmission: async (form: HTMLFormElement) => {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submitEvent)
    await testHelpers.waitFor()
  },

  // Generate random test data
  randomString: (length: number = 10) => {
    return Math.random().toString(36).substring(2, length + 2)
  },

  randomEmail: () => {
    return `${testHelpers.randomString()}@example.com`
  },

  randomDate: (daysFromNow: number = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split('T')[0]
  },
}

// Performance testing utilities
export const performanceTestUtils = {
  measureComponentRender: async (component: React.ReactElement) => {
    const start = performance.now()
    renderWithProviders(component)
    const end = performance.now()
    return end - start
  },

  measureAsyncOperation: async <T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await operation()
    const end = performance.now()
    return { result, duration: end - start }
  },
}

// Export everything for easy importing
export * from '@testing-library/react'
export * from '@testing-library/jest-dom'
export { default as userEvent } from '@testing-library/user-event'