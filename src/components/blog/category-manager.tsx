'use client'

import { useState, useEffect } from 'react'
import { categoryService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast-provider'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
  description?: string | null
  color?: string | null
  created_at: string
  updated_at?: string
  post_count?: number
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      await categoryService.createCategory(data)
      addToast({
        title: 'Success',
        description: 'Category created successfully',
        variant: 'success',
      })
      reset()
      loadCategories()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, data: CategoryFormData) => {
    setIsSubmitting(true)
    try {
      await categoryService.updateCategory(id, data)
      addToast({
        title: 'Success',
        description: 'Category updated successfully',
        variant: 'success',
      })
      setEditingId(null)
      loadCategories()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await categoryService.deleteCategory(id)
      addToast({
        title: 'Success',
        description: 'Category deleted successfully',
        variant: 'success',
      })
      loadCategories()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setValue('name', category.name)
    setValue('description', category.description || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Category Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  {...register('name')}
                  placeholder="Category name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                {...register('description')}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <Button type="submit" loading={isSubmitting}>
              Create Category
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories found</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  {editingId === category.id ? (
                    <EditCategoryForm
                      category={category}
                      onSave={(data) => handleUpdate(category.id, data)}
                      onCancel={cancelEdit}
                      isSubmitting={isSubmitting}
                      register={register}
                      handleSubmit={handleSubmit}
                      errors={errors}
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{category.name}</h3>
                          {category.post_count !== undefined && (
                            <Badge variant="secondary">
                              {category.post_count} posts
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EditCategoryForm({
  category,
  onSave,
  onCancel,
  isSubmitting,
  register,
  handleSubmit,
  errors,
}: {
  category: Category
  onSave: (data: CategoryFormData) => void
  onCancel: () => void
  isSubmitting: boolean
  register: any
  handleSubmit: any
  errors: any
}) {
  return (
    <form onSubmit={handleSubmit(onSave)} className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Input
            {...register('name')}
            placeholder="Category name"
            className={errors.name ? 'border-red-500' : ''}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={isSubmitting}>
            <Save className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        {...register('description')}
        placeholder="Optional description"
        rows={2}
      />
    </form>
  )
}