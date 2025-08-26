'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'
import { CheckCircle, Calendar, BookOpen, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading..." />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Personal
            <span className="text-blue-600 dark:text-blue-400"> Blog </span>
            &
            <span className="text-green-600 dark:text-green-400"> Productivity </span>
            Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Combine your personal blogging with daily schedule management.
            Track your productivity, reflect on your progress, and automatically
            generate blog content from your daily summaries.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Blog
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything You Need in One Place
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Blog Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create, edit, and organize your blog posts with a rich text editor.
                  Support for categories, tags, and SEO optimization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Daily Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize your daily tasks with priorities, due dates, and progress tracking.
                  Build better habits and achieve your goals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your productivity with detailed analytics and insights.
                  Monitor your progress and identify improvement areas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Auto-Blogging</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically generate blog posts from your daily summaries.
                  Share your productivity journey with others.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Be Better?
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of people who are taking control of their productivity
              and sharing their journey through blogging.
            </p>
            <Link href="/auth/register">
              <Button size="lg">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
