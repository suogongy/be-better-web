'use client'

import { useState, useEffect } from 'react'
import { commentService } from '@/lib/supabase/services/index'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageCircle, Check, X as XIcon, AlertTriangle, Shield, Filter, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Comment {