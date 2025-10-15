// Blog related types
export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface PostWithRelations {
  id: string
  title: string
  content?: string
  excerpt?: string
  featured_image?: string
  status: 'draft' | 'published' | 'archived'
  type: 'manual' | 'schedule_generated'
  meta_title?: string
  meta_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  categories: Category[]
  tags: Tag[]
  comment_count?: number
  category_ids?: string[]
  tag_ids?: string[]
}