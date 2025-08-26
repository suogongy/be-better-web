'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BlogEditor } from './blog-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { categoryService, tagService } from '@/lib/supabase/database'
import { createSlug } from '@/lib/utils'
import { X, Plus } from 'lucide-react'

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
  category_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface BlogPostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function BlogPostForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BlogPostFormProps) {
  const [content, setContent] = useState(initialData?.content || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.category_ids || [])
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tag_ids || [])
  const [newTagName, setNewTagName] = useState('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      category_ids: [],
      tag_ids: [],
      ...initialData,
    },
  })

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCategories(true)
        setLoadingTags(true)
        
        const [categoriesData, tagsData] = await Promise.all([
          categoryService.getCategories(),
          tagService.getTags(),
        ])
        
        setCategories(categoriesData)
        setTags(tagsData)
      } catch (error) {
        console.error('Failed to load categories and tags:', error)
      } finally {
        setLoadingCategories(false)
        setLoadingTags(false)
      }
    }

    loadData()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    const newSlug = createSlug(newTitle)
    setValue('slug', newSlug)
  }

  const handleFormSubmit = async (data: PostFormData) => {
    const formData = {
      ...data,
      content,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
    }
    await onSubmit(formData)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const createNewTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const newTag = await tagService.createTag({
        name: newTagName,
        slug: createSlug(newTagName),
      })
      setTags(prev => [...prev, newTag])
      setSelectedTags(prev => [...prev, newTag.id])
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Blog Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              {...register('title')}
              onChange={(e) => {
                register('title').onChange(e)
                handleTitleChange(e)
              }}
              placeholder="Enter post title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input
              {...register('slug')}
              placeholder="post-url-slug"
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <Textarea
              {...register('excerpt')}
              placeholder="Brief description"
              rows={3}
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            {loadingCategories ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      type="button"
                      variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId)
                      return category ? (
                        <Badge
                          key={categoryId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {category.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => toggleCategory(categoryId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            {loadingTags ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
                
                {/* Create New Tag */}
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Create new tag"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        createNewTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createNewTag}
                    disabled={!newTagName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId)
                      return tag ? (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => toggleTag(tagId)}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <BlogEditor
              content={content}
              onChange={(newContent: string) => {
                setContent(newContent)
                setValue('content', newContent)
              }}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
            >
              {initialData ? 'Update' : 'Create'} Post
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}