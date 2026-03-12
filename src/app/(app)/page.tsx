import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createCacheClient } from '@/utils/supabase/cache-client'
import { KPICards } from '@/components/analytics/KPICards'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus, ArrowRight, TrendingUp, Calendar,
  CheckSquare, FileText, ArrowUpRight, Search
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Dashboard | Stova Media',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  // Middleware runs getUser() on every request — cookie is already verified. Safe.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  const token = session.access_token
  const userId = session.user.id

  const { profile, activities, tasks } = await unstable_cache(
    async () => {
      const db = createCacheClient(token)
      const [profileRes, activitiesRes, tasksRes] = await Promise.all([
        db.from('users').select('name, role').eq('id', userId).single(),
        db.from('activity_log')
          .select('id, action_type, description, created_at, clients ( name )')
          .order('created_at', { ascending: false })
          .limit(5),
        db.from('tasks')
          .select('id, title, priority, due_date, clients ( name )')
          .eq('status', 'Pending')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(5),
      ])
      return {
        profile: profileRes.data,
        activities: activitiesRes.data ?? [],
        tasks: tasksRes.data ?? [],
      }
    },
    [`dashboard-${userId}`],
    { revalidate: 60, tags: [`dashboard-${userId}`, 'dashboard'] }
  )()

  const firstName = profile?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg italic">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pipeline">
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              To-Do
            </Button>
          </Link>
        </div>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Key updates across your workspace</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 font-semibold" render={<Link href="/analytics" />}>
                Full Report <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-5 hover:bg-muted/30 transition-colors group">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-transparent text-primary text-xs font-bold">
                              {activity.action_type.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            <span className="text-foreground font-semibold">
                              {(activity.clients as any)?.name || 'A client'}
                            </span>
                            <span className="text-muted-foreground ml-1">was updated</span>
                          </p>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full" suppressHydrationWarning>
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="mb-4 bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-20">
                    <Search className="h-8 w-8" />
                  </div>
                  <p className="text-lg">No recent activity found.</p>
                  <p className="text-sm">Start managing your pipeline to see updates here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/invoices/new" className="group">
              <Card className="hover:border-primary/50 transition-all hover:bg-muted/20 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="mt-4 font-bold text-lg">Send Invoice</h3>
                  <p className="text-sm text-muted-foreground">Get paid faster by creating a professional invoice.</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/proposals/new" className="group">
              <Card className="hover:border-primary/50 transition-all hover:bg-muted/20 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="mt-4 font-bold text-lg">New Proposal</h3>
                  <p className="text-sm text-muted-foreground">Create a high-converting proposal for a prospect.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-premium bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="group relative flex flex-col gap-1 p-3 rounded-lg border border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{task.title}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="font-medium text-foreground">{(task.clients as any)?.name}</span>
                      {task.due_date && (
                        <><span className="mx-1">•</span><span>Due {new Date(task.due_date).toLocaleDateString()}</span></>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No pending tasks.</p>
                </div>
              )}
              <Button variant="outline" className="w-full text-xs font-bold" render={<Link href="/tasks" />}>
                View All Tasks
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-6">
              <Badge className="mb-3 bg-primary text-white border-0">Pro Tip</Badge>
              <p className="text-sm font-medium leading-relaxed">
                Share the progress link with your clients to keep them updated automatically.
                Find it in the client details page!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
