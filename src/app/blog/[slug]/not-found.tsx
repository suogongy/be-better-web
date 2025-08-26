import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Search, FileText } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="mb-8">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Sorry, we couldn't find the blog post you're looking for. It may have been moved, deleted, or never existed.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Search className="h-5 w-5" />
            What would you like to do?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Link href="/blog">
              <Button className="w-full">
                Browse All Posts
              </Button>
            </Link>
            <Link href="/blog?search=productivity">
              <Button variant="outline" className="w-full">
                Search Popular Topics
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Still can't find what you're looking for?</p>
        <Link href="/blog" className="text-primary hover:underline flex items-center gap-2 justify-center">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>
    </div>
  )
}