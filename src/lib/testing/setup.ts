import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import 'whatwg-fetch'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        range: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.bebetterweb.com'

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Global test utilities
global.testUtils = {
  // Mock user object
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
    },
    created_at: '2023-01-01T00:00:00.000Z',
  },

  // Mock task object
  mockTask: {
    id: 'test-task-id',
    user_id: 'test-user-id',
    title: 'Test Task',
    description: 'Test Description',
    category: 'Work',
    priority: 'medium' as const,
    status: 'pending' as const,
    progress: 0,
    due_date: '2023-12-31',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  // Mock habit object
  mockHabit: {
    id: 'test-habit-id',
    user_id: 'test-user-id',
    name: 'Test Habit',
    description: 'Test habit description',
    frequency: 'daily' as const,
    target_count: 1,
    color: '#3B82F6',
    icon: 'circle',
    is_active: true,
    streak_count: 5,
    best_streak: 10,
    reminder_enabled: false,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },

  // Mock blog post object
  mockPost: {
    id: 'test-post-id',
    user_id: 'test-user-id',
    title: 'Test Post',
    content: 'Test content',
    excerpt: 'Test excerpt',
    status: 'published' as const,
    type: 'manual' as const,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    published_at: '2023-01-01T00:00:00.000Z',
  },

  // Mock daily summary object
  mockSummary: {
    id: 'test-summary-id',
    user_id: 'test-user-id',
    summary_date: '2023-01-01',
    total_tasks: 5,
    completed_tasks: 3,
    completion_rate: 60,
    productivity_score: 75,
    mood_rating: 4,
    energy_rating: 3,
    notes: 'Test notes',
    achievements: ['Completed important task'],
    challenges: ['Time management'],
    tomorrow_goals: ['Start new project'],
    auto_blog_generated: false,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },
}

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  localStorageMock.clear()
})

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers()
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})