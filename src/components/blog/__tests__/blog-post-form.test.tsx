import { render, screen, waitFor } from '@testing-library/react'
import { BlogPostForm } from '@/components/blog/blog-post-form'
import { categoryService, tagService } from '@/lib/supabase/services/index'

// Mock the services
jest.mock('@/lib/supabase/services/index')
const mockCategoryService = categoryService as jest.Mocked<typeof categoryService>
const mockTagService = tagService as jest.Mocked<typeof tagService>

describe('BlogPostForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock service responses
    mockCategoryService.getAllCategories.mockResolvedValue({
      data: [
        { id: '1', name: '技术' },
        { id: '2', name: '生活' }
      ]
    })
    
    mockTagService.getAllTags.mockResolvedValue({
      data: [
        { id: '1', name: 'React' },
        { id: '2', name: 'TypeScript' }
      ]
    })
  })

  it('应该加载并显示分类和标签', async () => {
    render(
      <BlogPostForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // 初始加载状态
    expect(screen.getByRole('status')).toBeInTheDocument()

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    // 检查分类是否显示
    expect(await screen.findByText('技术')).toBeInTheDocument()
    expect(await screen.findByText('生活')).toBeInTheDocument()

    // 检查标签是否显示
    expect(await screen.findByText('React')).toBeInTheDocument()
    expect(await screen.findByText('TypeScript')).toBeInTheDocument()
  })

  it('应该提交表单数据', async () => {
    render(
      <BlogPostForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    // 填写表单
    const titleInput = screen.getByPlaceholderText('输入文章标题...')
    const contentInput = screen.getByRole('textbox', { name: /内容/i })
    
    // 简单模拟输入
    titleInput.setAttribute('value', '测试文章')
    contentInput.setAttribute('value', '测试内容')

    // 选择分类
    const techCategory = screen.getByLabelText('技术')
    techCategory.click()

    // 选择标签
    const reactTag = screen.getByLabelText('React')
    reactTag.click()

    // 提交表单
    const saveButton = screen.getByRole('button', { name: /保存/i })
    saveButton.click()

    // 验证提交调用
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '测试文章',
        content: '测试内容',
        status: 'draft',
        category_ids: ['1'],
        tag_ids: ['1']
      })
    })
  })
})