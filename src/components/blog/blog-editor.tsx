'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState, useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { MediaLibrary } from '@/components/media/media-library'
import { Bold, Italic, Heading1, Heading2, List, Quote, Undo, Redo, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogEditorProps {
  content?: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function BlogEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your blog post...',
  editable = true,
  className,
}: BlogEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Handle SSR by checking if component is mounted
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Don't render during SSR to prevent hydration mismatches
  if (!isMounted) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-md" />
  }

  if (!editor) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-md" />
  }

  const MenuButton = ({ onClick, isActive, disabled, children, title }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <Button
      type="button"
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  )

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MediaLibrary
            onSelect={(media) => {
              if (editor) {
                editor.chain().focus().setImage({ src: media.url }).run()
              }
            }}
          />
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  )
}