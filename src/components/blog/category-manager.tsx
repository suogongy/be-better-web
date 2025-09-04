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
  name: z.string().min(1, '分类名称是必填的'),
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
      const result = await categoryService.getCategories()
      setCategories(Array.isArray(result) ? result : [])
    } catch (error) {
      addToast({
        title: '错误',
        description: '加载分类失败',
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
        title: '成功',
        description: '分类创建成功',
        variant: 'success',
      })
      reset()
      loadCategories()
    } catch (error) {
      addToast({
        title: '错误',
        description: '创建分类失败',
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
        title: '成功',
        description: '分类更新成功',
        variant: 'success',
      })
      setEditingId(null)
      loadCategories()
    } catch (error) {
      addToast({
        title: '错误',
        description: '更新分类失败',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return

    try {
      await categoryService.deleteCategory(id)
      addToast({
        title: '成功',
        description: '分类删除成功',
        variant: 'success',
      })
      loadCategories()
    } catch (error) {
      addToast({
        title: '错误',
        description: '删除分类失败',
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
            创建新分类
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">分类名称</label>
                <Input
                  {...register('name')}
                  placeholder="输入分类名称"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

            </div>

            <div>
                              <label className="block text-sm font-medium mb-2">描述</label>
              <Textarea
                {...register('description')}
                                  placeholder="可选描述信息"
                rows={3}
              />
            </div>

            <Button type="submit" loading={isSubmitting}>
              创建分类
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
                     <CardTitle>分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无分类</p>
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
                               {category.post_count} 篇文章
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
            placeholder="分类名称"
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
        placeholder="可选描述信息"
        rows={2}
      />
    </form>
  )
}