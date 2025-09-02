'use client'

import { useState, useEffect } from 'react'
import { tagService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-provider'
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type TagFormData = z.infer<typeof tagSchema>

interface BlogTag {
  id: string
  name: string
  created_at: string
  updated_at?: string
  post_count?: number
}

export function TagManager() {
  const [tags, setTags] = useState<BlogTag[]>([])
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
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  })

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await tagService.getTags()
      setTags(data)
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  const handleCreate = async (data: TagFormData) => {
    setIsSubmitting(true)
    try {
      await tagService.createTag(data)
      addToast({
        title: 'Success',
        description: 'Tag created successfully',
        variant: 'success',
      })
      reset()
      loadTags()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: string, data: TagFormData) => {
    setIsSubmitting(true)
    try {
      await tagService.updateTag(id, data)
      addToast({
        title: 'Success',
        description: 'Tag updated successfully',
        variant: 'success',
      })
      setEditingId(null)
      loadTags()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update tag',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    try {
      await tagService.deleteTag(id)
      addToast({
        title: 'Success',
        description: 'Tag deleted successfully',
        variant: 'success',
      })
      loadTags()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete tag',
        variant: 'destructive',
      })
    }
  }

  const startEdit = (tag: BlogTag) => {
    setEditingId(tag.id)
    setValue('name', tag.name)
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
      {/* Create Tag Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  {...register('name')}
                  placeholder="Tag name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

            </div>

            <Button type="submit" loading={isSubmitting}>
              Create Tag
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tags found</p>
          ) : (
            <div className="space-y-4">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  {editingId === tag.id ? (
                    <EditTagForm
                      tag={tag}
                      onSave={(data) => handleUpdate(tag.id, data)}
                      onCancel={cancelEdit}
                      isSubmitting={isSubmitting}
                      register={register}
                      handleSubmit={handleSubmit}
                      errors={errors}
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tag.name}</h3>
                          {tag.post_count !== undefined && (
                            <Badge variant="secondary">
                              {tag.post_count} posts
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag.id)}
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

      {/* Tag Cloud Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Cloud Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {tag.name}
                {tag.post_count !== undefined && ` (${tag.post_count})`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EditTagForm({
  tag,
  onSave,
  onCancel,
  isSubmitting,
  register,
  handleSubmit,
  errors,
}: {
  tag: BlogTag
  onSave: (data: TagFormData) => void
  onCancel: () => void
  isSubmitting: boolean
  register: any
  handleSubmit: any
  errors: any
}) {
  return (
    <form onSubmit={handleSubmit(onSave)} className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            {...register('name')}
            placeholder="Tag name"
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
    </form>
  )
}