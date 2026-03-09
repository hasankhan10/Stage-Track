import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cachedFetch, cacheTags } from '@/lib/cache'

export const metadata = { title: 'Tasks | Your Brand' }

export default async function TasksPage() {
    const supabase = await createClient()
    // Middleware calls getUser() on every request — cookie is already verified. Safe.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return redirect('/login')

    const token = session.access_token
    const { tasks, clients, workspaceUsers } = await cachedFetch(
        cacheTags.tasks(session.user.id), token,
        async (db) => {
            const [tasksRes, clientsRes, usersRes] = await Promise.all([
                db.from('tasks').select('*, clients ( id, name ), users:assigned_to ( id, name )').order('due_date', { ascending: true, nullsFirst: true }),
                db.from('clients').select('id, name').order('name'),
                db.from('users').select('id, name').order('name'),
            ])
            return {
                tasks: tasksRes.data || [],
                clients: clientsRes.data || [],
                workspaceUsers: usersRes.data || [],
            }
        },
        { revalidate: 60, tags: [cacheTags.tasks(session.user.id)] }
    )

    function getPriorityIcon(priority: string) {
        if (priority === 'High') return <AlertCircle className="h-4 w-4 text-destructive" />
        if (priority === 'Medium') return <Clock className="h-4 w-4 text-amber-500" />
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }

    function getStatusColor(status: string) {
        if (status === 'Pending') return 'bg-muted text-muted-foreground'
        if (status === 'In Progress') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Tasks</h2>
                    <p className="text-muted-foreground">Manage your team's to-dos and deliverables.</p>
                </div>
                <CreateTaskDialog clients={clients} users={workspaceUsers} />
            </div>

            {tasks.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No tasks found" description="You don't have any tasks in your workspace yet. Create one to get started." />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm p-5 hover:border-primary/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold line-clamp-2 leading-tight">{task.title}</h3>
                                <Badge variant="secondary" className={`whitespace-nowrap ${getStatusColor(task.status)}`}>{task.status}</Badge>
                            </div>

                            {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{task.description}</p>
                            )}

                            <div className="mt-auto space-y-3 pt-4 border-t">
                                {task.clients && (
                                    <div className="flex items-center text-sm font-medium">
                                        <span className="text-muted-foreground mr-2">Client:</span>
                                        {(task.clients as any).name}
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        {getPriorityIcon(task.priority)}
                                        {task.priority}
                                    </div>
                                    {task.due_date && (
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                                    <span className="text-xs text-muted-foreground">
                                        Assignee: {task.users ? (task.users as any).name : 'Unassigned'}
                                    </span>
                                    <button className="text-xs font-semibold text-primary hover:underline">Mark Done</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
