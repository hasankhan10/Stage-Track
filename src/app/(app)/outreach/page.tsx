import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOutreachDialog } from '@/components/outreach/LogOutreachDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { MessageSquare, Mail, Phone, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export const metadata = { title: 'Outreach | StageTrack' }

export default async function OutreachPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const [logsRes, clientsRes] = await Promise.all([
        supabase
            .from('outreach_log')
            .select(`
        *,
        clients ( id, name, company ),
        users ( name )
      `)
            .order('contacted_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name')
    ])

    const logs = logsRes.data || []
    const clients = clientsRes.data || []

    function getChannelIcon(channel: string) {
        switch (channel) {
            case 'Email': return <Mail className="h-4 w-4" />
            case 'Call': return <Phone className="h-4 w-4" />
            case 'LinkedIn': return (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            )
            default: return <MessageSquare className="h-4 w-4" />
        }
    }

    function getStatusColor(status: string) {
        if (['Replied', 'Meeting Set', 'Interested'].includes(status)) return 'bg-green-100 text-green-700'
        if (['Bounced', 'Not Interested'].includes(status)) return 'bg-red-100 text-red-700'
        return 'bg-muted text-muted-foreground'
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Outreach Logs</h2>
                    <p className="text-muted-foreground">Track all communication across your pipeline.</p>
                </div>
                <LogOutreachDialog clients={clients} />
            </div>

            {logs.length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title="No outreach logged"
                    description="You haven't logged any calls, emails, or meetings yet."
                />
            ) : (
                <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Channel & Status</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Notes</th>
                                    <th className="px-6 py-4">Logged By</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <Link href={`/clients/${log.client_id}`} className="hover:underline flex items-center gap-2">
                                                {log.clients?.name || 'Unknown'}
                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            </Link>
                                            {log.clients?.company && (
                                                <div className="text-xs text-muted-foreground font-normal">{log.clients.company}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-muted-foreground">{getChannelIcon(log.channel)}</span>
                                                {log.channel}
                                            </div>
                                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(log.status)}`}>
                                                {log.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell max-w-xs truncate text-muted-foreground">
                                            {log.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border">
                                                    <AvatarFallback className="text-[10px]">{log.users?.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-muted-foreground">{log.users?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap text-muted-foreground">
                                            {new Date(log.contacted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
