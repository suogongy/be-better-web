import { exportService } from '@/lib/supabase/advanced-services'
import { supabase } from '@/lib/supabase/client'
import { testDataGenerators } from '@/lib/testing/utils'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('exportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createExport', () => {
    it('should create export request successfully', async () => {
      const exportOptions = {
        user_id: 'user-id',
        data_types: ['tasks', 'summaries', 'habits'],
        format: 'json' as const,
        date_range: {
          start: '2023-01-01',
          end: '2023-12-31',
        },
        include_metadata: true,
      }

      const mockExport = {
        id: 'export-' + Math.random().toString(36).substr(2, 9),
        user_id: 'user-id',
        status: 'pending' as const,
        data_types: ['tasks', 'summaries', 'habits'],
        format: 'json' as const,
        options: exportOptions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        download_url: null,
        file_size: null,
        expires_at: null,
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExport,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await exportService.createExport(exportOptions)

      expect(result).toEqual(mockExport)
      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })

    it('should throw error on creation failure', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      } as any)

      await expect(exportService.createExport({
        user_id: 'user-id',
        data_types: ['tasks'],
        format: 'json',
      }))
        .rejects
        .toThrow('Failed to create export')
    })
  })

  describe('getExports', () => {
    it('should fetch user exports successfully', async () => {
      const mockExports = [
        {
          id: 'export-1',
          user_id: 'user-id',
          status: 'completed' as const,
          data_types: ['tasks'],
          format: 'json' as const,
          created_at: '2023-01-01T00:00:00.000Z',
          completed_at: '2023-01-01T00:05:00.000Z',
        },
        {
          id: 'export-2',
          user_id: 'user-id',
          status: 'pending' as const,
          data_types: ['summaries'],
          format: 'csv' as const,
          created_at: '2023-01-02T00:00:00.000Z',
          completed_at: null,
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockExports,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await exportService.getExports('user-id')

      expect(result).toEqual(mockExports)
      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })

    it('should apply status filter when provided', async () => {
      const mockExports = [
        {
          id: 'export-1',
          status: 'completed' as const,
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockExports,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      await exportService.getExports('user-id', { status: 'completed' })

      // Should have two eq calls: one for user_id, one for status
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed')
    })
  })

  describe('getExport', () => {
    it('should fetch single export successfully', async () => {
      const mockExport = {
        id: 'export-id',
        user_id: 'user-id',
        status: 'completed' as const,
        data_types: ['tasks'],
        format: 'json' as const,
        download_url: 'https://example.com/download/export.json',
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExport,
              error: null,
            }),
          }),
        }),
      } as any)

      const result = await exportService.getExport('export-id')

      expect(result).toEqual(mockExport)
      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })

    it('should return null when export not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any)

      const result = await exportService.getExport('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('updateExportStatus', () => {
    it('should update export status successfully', async () => {
      const mockUpdatedExport = {
        id: 'export-id',
        status: 'completed' as const,
        download_url: 'https://example.com/download/export.json',
        file_size: 1024,
        completed_at: new Date().toISOString(),
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedExport,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const result = await exportService.updateExportStatus('export-id', 'completed', {
        download_url: 'https://example.com/download/export.json',
        file_size: 1024,
      })

      expect(result).toEqual(mockUpdatedExport)
      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })
  })

  describe('deleteExport', () => {
    it('should delete export successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await exportService.deleteExport('export-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })

    it('should throw error on deletion failure', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      } as any)

      await expect(exportService.deleteExport('export-id'))
        .rejects
        .toThrow('Failed to delete export')
    })
  })

  describe('processExport', () => {
    it('should process JSON export successfully', async () => {
      // Mock data queries
      const mockTasks = [
        testDataGenerators.createTask({ title: 'Task 1', status: 'completed' }),
        testDataGenerators.createTask({ title: 'Task 2', status: 'pending' }),
      ]

      const mockSummaries = [
        testDataGenerators.createSummary({ summary_date: '2023-01-01' }),
        testDataGenerators.createSummary({ summary_date: '2023-01-02' }),
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'tasks') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data: mockTasks,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'daily_summaries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data: mockSummaries,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }
      } as any)

      const exportData = {
        id: 'export-id',
        user_id: 'user-id',
        data_types: ['tasks', 'summaries'],
        format: 'json' as const,
        options: {
          date_range: {
            start: '2023-01-01',
            end: '2023-12-31',
          },
          include_metadata: true,
        },
      }

      const result = await exportService.processExport(exportData)

      expect(result).toBeDefined()
      expect(result.tasks).toHaveLength(2)
      expect(result.summaries).toHaveLength(2)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.export_date).toBeDefined()
      expect(result.metadata.format).toBe('json')
    })

    it('should process CSV export successfully', async () => {
      const mockTasks = [
        testDataGenerators.createTask({ title: 'Task 1', category: 'Work' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: mockTasks,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const exportData = {
        id: 'export-id',
        user_id: 'user-id',
        data_types: ['tasks'],
        format: 'csv' as const,
        options: {},
      }

      const result = await exportService.processExport(exportData)

      expect(typeof result).toBe('string')
      expect(result).toContain('title,category,status') // CSV headers
      expect(result).toContain('Task 1,Work,pending') // CSV data
    })

    it('should handle empty data sets', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const exportData = {
        id: 'export-id',
        user_id: 'user-id',
        data_types: ['tasks'],
        format: 'json' as const,
        options: {},
      }

      const result = await exportService.processExport(exportData)

      expect(result.tasks).toHaveLength(0)
      expect(result.metadata.total_records).toBe(0)
    })
  })

  describe('generateDownloadUrl', () => {
    it('should generate secure download URL', async () => {
      const mockStorageResponse = {
        data: {
          signedUrl: 'https://storage.example.com/signed-url?token=abc123',
        },
        error: null,
      }

      // Mock Supabase storage
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          createSignedUrl: jest.fn().mockResolvedValue(mockStorageResponse),
        }),
      }

      // Mock supabase.storage
      mockSupabase.storage = mockStorage as any

      const result = await exportService.generateDownloadUrl('export-id', 'data.json')

      expect(result).toBe(mockStorageResponse.data.signedUrl)
      expect(mockStorage.from).toHaveBeenCalledWith('exports')
    })

    it('should throw error on URL generation failure', async () => {
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          createSignedUrl: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Storage error' },
          }),
        }),
      }

      mockSupabase.storage = mockStorage as any

      await expect(exportService.generateDownloadUrl('export-id', 'data.json'))
        .rejects
        .toThrow('Failed to generate download URL')
    })
  })

  describe('cleanupExpiredExports', () => {
    it('should clean up expired exports', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any)

      await exportService.cleanupExpiredExports()

      expect(mockSupabase.from).toHaveBeenCalledWith('data_exports')
    })
  })
})