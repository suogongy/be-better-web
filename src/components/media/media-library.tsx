'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  File, 
  Download,
  Trash2,
  Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'file'
  url: string
  size: number
  created_at: string
  metadata?: {
    width?: number
    height?: number
    alt?: string
  }
}

interface MediaLibraryProps {
  onSelect?: (media: MediaItem) => void
  multiple?: boolean
  acceptedTypes?: string[]
  maxFiles?: number
  className?: string
}

export function MediaLibrary({
  onSelect,
  multiple = false,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  maxFiles = 10,
  className
}: MediaLibraryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const supabase = createClient()

  // 获取媒体文件列表
  const fetchMediaItems = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .storage
        .from('media')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // 获取每个文件的公共URL
      const itemsWithUrls = await Promise.all(
        data.map(async (item) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(item.name)
          
          return {
            id: item.id,
            name: item.name,
            type: item.metadata?.mimetype?.startsWith('image/') ? 'image' : 'file',
            url: publicUrl,
            size: item.metadata?.size || 0,
            created_at: item.created_at,
            metadata: {
              width: item.metadata?.width,
              height: item.metadata?.height,
              alt: item.name.split('.')[0]
            }
          } as MediaItem
        })
      )

      setMediaItems(itemsWithUrls)
    } catch (error) {
      console.error('Error fetching media items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchMediaItems()
    }
  }, [isOpen])

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${Date.now()}-${file.name}`
        
        const { error } = await supabase.storage
          .from('media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error
      }

      // 刷新列表
      await fetchMediaItems()
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      // 重置input
      event.target.value = ''
    }
  }

  // 删除文件
  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('media')
        .remove([fileName])

      if (error) throw error
      
      // 刷新列表
      await fetchMediaItems()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  // 选择文件
  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      setSelectedItems(prev => {
        const isSelected = prev.some(i => i.id === item.id)
        if (isSelected) {
          return prev.filter(i => i.id !== item.id)
        } else {
          return [...prev, item]
        }
      })
    } else {
      setSelectedItems([item])
    }
  }

  // 确认选择
  const handleConfirm = () => {
    if (selectedItems.length > 0) {
      if (multiple) {
        onSelect?.(selectedItems[0]) // 暂时只支持单个选择
      } else {
        onSelect?.(selectedItems[0])
      }
      setIsOpen(false)
      setSelectedItems([])
    }
  }

  // 过滤文件
  const filteredItems = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <ImageIcon className="h-4 w-4 mr-2" />
          选择媒体
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>媒体库</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索媒体文件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                网格
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                列表
              </Button>
            </div>
            
            <div className="relative">
              <input
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? '上传中...' : '上传文件'}
              </Button>
            </div>
          </div>

          {/* 媒体列表 */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无媒体文件</p>
                  <p className="text-sm">点击上传按钮添加文件</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
                      selectedItems.some(i => i.id === item.id) && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="aspect-square relative">
                      {item.type === 'image' ? (
                        <Image
                          src={item.url}
                          alt={item.metadata?.alt || item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <File className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* 选择状态 */}
                      {selectedItems.some(i => i.id === item.id) && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <p className="text-sm font-medium truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                    
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.name)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:shadow-md",
                      selectedItems.some(i => i.id === item.id) && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <Image
                            src={item.url}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-cover rounded"
                          />
                        ) : (
                          <File className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(item.url, '_blank')
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.name)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">
              已选择 {selectedItems.length} 个文件
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedItems.length === 0}
              >
                确定
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}