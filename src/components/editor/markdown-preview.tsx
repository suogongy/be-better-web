'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

interface MarkdownPreviewProps {
  content: string
  className?: string
  theme?: 'light' | 'dark'
  wide?: boolean
}

export function MarkdownPreview({ 
  content, 
  className,
  theme = 'light',
  wide = false
}: MarkdownPreviewProps) {
  const components = {
    h1: ({ children, ...props }: any) => (
      <h1 
        className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 
        className="text-2xl font-semibold mt-6 mb-3 pt-4"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 
        className="text-xl font-medium mt-5 mb-2"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 
        className="text-lg font-medium mt-4 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 
        className="text-base font-medium mt-3 mb-1"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 
        className="text-sm font-medium mt-2 mb-1"
        {...props}
      >
        {children}
      </h6>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    a: ({ href, children, ...props }: any) => (
      <a 
        href={href}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 italic bg-gray-50 dark:bg-gray-800 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="mb-4 space-y-1 list-disc list-inside" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="mb-4 space-y-1 list-decimal list-inside" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="pl-2" {...props}>
        {children}
      </li>
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table 
          className="min-w-full border-collapse border border-gray-300 dark:border-gray-600"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr 
        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        {...props}
      >
        {children}
      </tr>
    ),
    th: ({ children, ...props }: any) => (
      <th 
        className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td 
        className="border border-gray-300 dark:border-gray-600 px-4 py-2"
        {...props}
      >
        {children}
      </td>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      return !inline && language ? (
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
          language={language}
          PreTag="div"
          customStyle={{
            margin: '1em 0',
            borderRadius: '0.5rem',
            fontSize: '0.875em',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code 
          className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }: any) => (
      <pre className="overflow-x-auto my-4" {...props}>
        {children}
      </pre>
    ),
    hr: ({ ...props }: any) => (
      <hr className="my-8 border-gray-300 dark:border-gray-600" {...props} />
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }: any) => (
      <del className="line-through" {...props}>
        {children}
      </del>
    ),
    img: ({ src, alt, ...props }: any) => (
      <img 
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg my-4 shadow-md"
        loading="lazy"
        {...props}
      />
    ),
    // Task lists
    input: ({ checked, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
        disabled
        {...props}
      />
    ),
  }

  return (
    <div className={cn(
      wide 
        ? 'prose prose-lg dark:prose-invert max-w-5xl prose-p:max-w-none prose-headings:max-w-none'
        : 'prose prose-sm dark:prose-invert max-w-none',
      'prose-headings:scroll-mt-20',
      'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800',
      'prose-code:before:content-none prose-code:after:content-none',
      'prose-img:rounded-lg prose-img:shadow-md',
      'prose-blockquote:not-italic',
      'prose-table:overflow-x-auto',
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Export a simplified version for inline content
export function SimpleMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <MarkdownPreview 
      content={content} 
      className={className}
      theme="light"
    />
  )
}