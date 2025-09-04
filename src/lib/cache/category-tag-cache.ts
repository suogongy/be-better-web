import { createClient } from '@/lib/supabase/client'
import type { Category, Tag } from '@/types/blog'

interface CacheData<T> {
  data: T[]
  lastUpdate: number
}

class CategoryTagCache {
  private categories: CacheData<Category> = {
    data: [],
    lastUpdate: 0
  }
  
  private tags: CacheData<Tag> = {
    data: [],
    lastUpdate: 0
  }
  
  private categoryMap: Map<string, Category> = new Map()
  private tagMap: Map<string, Tag> = new Map()
  
  private readonly CACHE_DURATION = 10000 // 10秒缓存
  private isInitialized = false
  private syncTimer: NodeJS.Timeout | null = null

  /**
   * 初始化缓存并启动定时同步
   */
  async initialize() {
    if (this.isInitialized) return
    
    await this.syncAll()
    this.startPeriodicSync()
    this.isInitialized = true
  }

  /**
   * 启动定时同步
   */
  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    
    this.syncTimer = setInterval(() => {
      this.syncAll().catch(console.error)
    }, this.CACHE_DURATION)
  }

  /**
   * 同步所有数据
   */
  private async syncAll() {
    try {
      const [categories, tags] = await Promise.all([
        this.fetchCategories(),
        this.fetchTags()
      ])
      
      this.updateCategories(categories)
      this.updateTags(tags)
    } catch (error) {
      console.error('Failed to sync category/tag cache:', error)
    }
  }

  /**
   * 从数据库获取分类数据
   */
  private async fetchCategories(): Promise<Category[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    
    return data || []
  }

  /**
   * 从数据库获取标签数据
   */
  private async fetchTags(): Promise<Tag[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }
    
    return data || []
  }

  /**
   * 更新分类缓存
   */
  private updateCategories(categories: Category[]) {
    this.categories = {
      data: categories,
      lastUpdate: Date.now()
    }
    
    // 更新映射表
    this.categoryMap.clear()
    categories.forEach(category => {
      this.categoryMap.set(category.id, category)
    })
  }

  /**
   * 更新标签缓存
   */
  private updateTags(tags: Tag[]) {
    this.tags = {
      data: tags,
      lastUpdate: Date.now()
    }
    
    // 更新映射表
    this.tagMap.clear()
    tags.forEach(tag => {
      this.tagMap.set(tag.id, tag)
    })
  }

  /**
   * 获取所有分类
   */
  getCategories(): Category[] {
    return [...this.categories.data]
  }

  /**
   * 获取所有标签
   */
  getTags(): Tag[] {
    return [...this.tags.data]
  }

  /**
   * 根据ID获取分类
   */
  getCategoryById(id: string): Category | undefined {
    return this.categoryMap.get(id)
  }

  /**
   * 根据ID获取标签
   */
  getTagById(id: string): Tag | undefined {
    return this.tagMap.get(id)
  }

  /**
   * 根据ID批量获取分类
   */
  getCategoriesByIds(ids: string[]): Category[] {
    return ids
      .map(id => this.categoryMap.get(id))
      .filter((category): category is Category => category !== undefined)
  }

  /**
   * 根据ID批量获取标签
   */
  getTagsByIds(ids: string[]): Tag[] {
    return ids
      .map(id => this.tagMap.get(id))
      .filter((tag): tag is Tag => tag !== undefined)
  }

  /**
   * 强制刷新缓存
   */
  async refresh(): Promise<void> {
    await this.syncAll()
  }

  /**
   * 销毁缓存
   */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
    
    this.categories = { data: [], lastUpdate: 0 }
    this.tags = { data: [], lastUpdate: 0 }
    this.categoryMap.clear()
    this.tagMap.clear()
    this.isInitialized = false
  }

  /**
   * 获取缓存状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      categoriesCount: this.categories.data.length,
      tagsCount: this.tags.data.length,
      lastUpdate: {
        categories: new Date(this.categories.lastUpdate).toISOString(),
        tags: new Date(this.tags.lastUpdate).toISOString()
      }
    }
  }
}

// 创建单例实例
const categoryTagCache = new CategoryTagCache()

// 初始化缓存（在应用启动时调用）
export const initializeCategoryTagCache = () => categoryTagCache.initialize()

// 导出缓存实例
export { categoryTagCache }