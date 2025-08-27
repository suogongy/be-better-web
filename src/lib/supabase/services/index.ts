// 统一导出所有服务和错误处理类
export { postService } from './post-service'
export { categoryService } from './category-service'
export { tagService } from './tag-service'
export { commentService } from './comment-service'
export { taskService } from './task-service'
export { userService } from './user-service'
export { summaryService } from './summary-service'
export { exportService } from './export-service'
export { DatabaseError } from './database-error'

// 导出数据库类型
export type {
  User, UserInsert, UserUpdate,
  Post, PostInsert, PostUpdate,
  Category, CategoryInsert, CategoryUpdate,
  Tag, TagInsert, TagUpdate,
  Comment, CommentInsert, CommentUpdate,
  Task, TaskInsert, TaskUpdate,
  DailySummary, DailySummaryInsert, DailySummaryUpdate,
  DataExport, DataExportInsert, DataExportUpdate,
  PostCategory, PostCategoryInsert, PostCategoryUpdate,
  PostTag, PostTagInsert, PostTagUpdate
} from '@/types/database'