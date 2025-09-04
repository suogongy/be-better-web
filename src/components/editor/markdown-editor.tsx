'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import './markdown-editor.css'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MediaLibrary } from '@/components/media/media-library'
import { MarkdownPreview } from './markdown-preview'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  Code,
  Table,
  Minus,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Save,
  FileText,
  Strikethrough,
  CheckSquare,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  previewMode?: 'none' | 'right' | 'bottom'
  showToolbar?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
  onSave?: (value: string) => void
  height?: string
}

const markdownKeymap = keymap.of([
  ...defaultKeymap,
  ...searchKeymap,
  { key: 'Mod-b', run: insertBold },
  { key: 'Mod-i', run: insertItalic },
  { key: 'Mod-k', run: insertLink },
  { key: 'Mod-Shift-c', run: insertCode },
])

function insertBold({ state, dispatch }: any) {
  const selection = state.selection.main
  const text = state.sliceDoc(selection.from, selection.to)
  dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: `**${text}**`,
    },
    selection: { anchor: selection.from + 2, head: selection.to + 2 },
  })
  return true
}

function insertItalic({ state, dispatch }: any) {
  const selection = state.selection.main
  const text = state.sliceDoc(selection.from, selection.to)
  dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: `*${text}*`,
    },
    selection: { anchor: selection.from + 1, head: selection.to + 1 },
  })
  return true
}

function insertLink({ state, dispatch }: any) {
  const selection = state.selection.main
  const text = state.sliceDoc(selection.from, selection.to)
  dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: `[${text}](url)`,
    },
    selection: { anchor: selection.from + text.length + 3, head: selection.to + text.length + 6 },
  })
  return true
}

function insertCode({ state, dispatch }: any) {
  const selection = state.selection.main
  const text = state.sliceDoc(selection.from, selection.to)
  dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: `\`${text}\``,
    },
    selection: { anchor: selection.from + 1, head: selection.to + 1 },
  })
  return true
}

export function MarkdownEditor({
  value = '',
  onChange,
  placeholder = '开始编写你的博客文章...',
  editable = true,
  className,
  previewMode = 'right',
  showToolbar = true,
  autoSave = false,
  autoSaveDelay = 3000,
  onSave,
  height = '500px',
}: MarkdownEditorProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(previewMode !== 'none')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const viewRef = useRef<any>(null)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = useCallback((newValue: string) => {
    setInternalValue(newValue)
    onChange(newValue)

    // Auto save functionality
    if (autoSave && onSave) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      const timer = setTimeout(() => {
        onSave(newValue)
        setLastSaved(new Date())
      }, autoSaveDelay)
      setAutoSaveTimer(timer)
    }
  }, [onChange, autoSave, onSave, autoSaveDelay, autoSaveTimer])

  const insertText = (text: string, cursorOffset = 0) => {
    if (!viewRef.current?.view) return

    const { state, dispatch } = viewRef.current.view
    const selection = state.selection.main
    const selectedText = state.sliceDoc(selection.from, selection.to)
    const newText = text.replace('$selected', selectedText)
    
    dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: newText
      },
      selection: {
        anchor: selection.from + cursorOffset,
        head: selection.from + cursorOffset
      }
    })
  }

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    tooltip, 
    isActive = false,
    shortcut 
  }: {
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    tooltip: string
    isActive?: boolean
    shortcut?: string
  }) => (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 relative group"
      title={`${tooltip}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <Icon className="h-4 w-4" />
      {shortcut && (
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {shortcut}
        </span>
      )}
    </Button>
  )

  const editorClasses = cn(
    'border rounded-lg overflow-hidden transition-all duration-200',
    isFullscreen && 'fixed inset-0 z-50 bg-white dark:bg-gray-900',
    className
  )

  const containerClasses = cn(
    'grid gap-4',
    showPreview && previewMode === 'right' && 'grid-cols-1 lg:grid-cols-2',
    showPreview && previewMode === 'bottom' && 'grid-rows-1 lg:grid-rows-2'
  )

  return (
    <div className={editorClasses}>
      {/* Header */}
      {showToolbar && (
        <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Formatting */}
            <ToolbarButton
              onClick={() => insertText('**$selected**', 2)}
              icon={Bold}
              tooltip="粗体"
              shortcut="⌘B"
            />
            <ToolbarButton
              onClick={() => insertText('*$selected*', 1)}
              icon={Italic}
              tooltip="斜体"
              shortcut="⌘I"
            />
            <ToolbarButton
              onClick={() => insertText('~~$selected~~', 2)}
              icon={Strikethrough}
              tooltip="删除线"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Headings */}
            <ToolbarButton
              onClick={() => insertText('\n# $selected\n', 3)}
              icon={Heading1}
              tooltip="标题 1"
            />
            <ToolbarButton
              onClick={() => insertText('\n## $selected\n', 4)}
              icon={Heading2}
              tooltip="标题 2"
            />
            <ToolbarButton
              onClick={() => insertText('\n### $selected\n', 5)}
              icon={Heading3}
              tooltip="标题 3"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Lists */}
            <ToolbarButton
              onClick={() => insertText('\n- $selected\n', 3)}
              icon={List}
              tooltip="无序列表"
            />
            <ToolbarButton
              onClick={() => insertText('\n1. $selected\n', 4)}
              icon={ListOrdered}
              tooltip="有序列表"
            />
            <ToolbarButton
              onClick={() => insertText('\n- [ ] $selected\n', 6)}
              icon={CheckSquare}
              tooltip="任务列表"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* Insert */}
            <ToolbarButton
              onClick={() => insertText('\n> $selected\n', 3)}
              icon={Quote}
              tooltip="引用"
            />
            <ToolbarButton
              onClick={() => insertText('`$selected`', 1)}
              icon={Code}
              tooltip="行内代码"
              shortcut="⌘⇧C"
            />
            <ToolbarButton
              onClick={() => insertText('\n```$selected\n```\n', 4)}
              icon={FileText}
              tooltip="代码块"
            />
            <ToolbarButton
              onClick={() => insertText('\n| 列1 | 列2 | 列3 |\n|------|------|------|\n|      |      |      |\n', 42)}
              icon={Table}
              tooltip="表格"
            />
            <ToolbarButton
              onClick={() => insertText('[$selected](url)', 1)}
              icon={Link}
              tooltip="链接"
              shortcut="⌘K"
            />
            
            {/* Image Upload */}
            <MediaLibrary
              onSelect={(media) => {
                insertText(`![${media.name || 'image'}](${media.url})`, 0)
              }}
            >
              <ToolbarButton
                icon={ImageIcon}
                tooltip="插入图片"
              />
            </MediaLibrary>
            
            <ToolbarButton
              onClick={() => insertText('\n---\n', 5)}
              icon={Minus}
              tooltip="分割线"
            />
          </div>
          
          <div className="flex items-center gap-1">
            {/* Preview Toggle */}
            {previewMode !== 'none' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-8 w-8 p-0"
                title={showPreview ? '隐藏预览' : '显示预览'}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Save */}
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSave(internalValue)
                  setLastSaved(new Date())
                }}
                className="h-8 w-8 p-0"
                title="保存"
                disabled={!editable}
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
            
            {/* Close Fullscreen */}
            {isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="h-8 w-8 p-0 ml-2"
                title="关闭全屏 (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Auto Save Status */}
          {autoSave && lastSaved && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              自动保存于 {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      {/* Editor Container */}
      <div className={containerClasses}>
        {/* Editor */}
        <div className={cn(showPreview && 'border-r')}>
          <CodeMirror
            ref={viewRef}
            value={internalValue}
            height={isFullscreen ? 'calc(100vh - 50px)' : height}
            extensions={[
              markdown(),
              keymap.of(markdownKeymap),
              autocompletion(),
              highlightSelectionMatches(),
              EditorView.lineWrapping,
              EditorView.theme({
                '&': {
                  fontSize: '14px',
                  fontFamily: '"Fira Code", "Monaco", "Menlo", monospace',
                },
                '.cm-content': {
                  padding: '16px',
                  minHeight: '200px',
                },
                '.cm-line': {
                  padding: '0 2px',
                },
              }),
            ]}
            onChange={handleChange}
            editable={editable}
            theme="light"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              bracketMatching: true,
              autocompletion: true,
              foldGutter: true,
              searchKeymap: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              tabSize: 2,
            }}
            placeholder={placeholder}
          />
        </div>
        
        {/* Preview */}
        {showPreview && (
          <Card className="p-4 overflow-auto h-full">
            <MarkdownPreview content={internalValue} />
          </Card>
        )}
      </div>
    </div>
  )
}

// Preview component removed, now using imported MarkdownPreview