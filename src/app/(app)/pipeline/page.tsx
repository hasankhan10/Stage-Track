import { PIPELINE_STAGES } from '@/lib/pipeline'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Users, TrendingUp, IndianRupee, ArrowRight,
    Megaphone, Phone, FileText, Handshake,
    Rocket, CheckCircle2, RefreshCcw, Package,
    StarOff, RotateCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cachedFetch, cacheTags } from '@/lib/cache'

export const metadata = {
    title: 'Pipeline | Stova Media',
    description: 'Manage your client pipeline across all stages',
}

const stageIcons: Record<number, React.ElementType> = {
    1: Megaphone, 2: Phone, 3: Phone, 4: FileText, 5: Handshake,
    6: CheckCircle2, 7: Rocket, 8: TrendingUp, 9: RefreshCcw,
    10: Package, 11: StarOff, 12: RotateCcw,
}

const groupColors: Record<string, { bg: string; border: string; badge: string; text: string; accent: string }> = {
    'Lead': { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/30 hover:border-blue-500/70', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', text: 'text-blue-600 dark:text-blue-400', accent: '#3B82F6' },
    'Prospect': { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/30 hover:border-orange-500/70', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', text: 'text-orange-600 dark:text-orange-400', accent: '#F97316' },
    'Client': { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/30 hover:border-emerald-500/70', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', text: 'text-emerald-600 dark:text-emerald-400', accent: '#10B981' },
    'Archived': { bg: 'from-slate-500/10 to-slate-600/5', border: 'border-slate-500/30 hover:border-slate-500/70', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300', text: 'text-slate-600 dark:text-slate-400', accent: '#64748B' },
}

export default async function PipelinePage() {
    const supabase = await createClient()
    // Middleware calls getUser() on every request — cookie is already verified. Safe.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return redirect('/login')

    const token = session.access_token

    const profile = await cachedFetch(
        cacheTags.user(session.user.id), token,
        async (db) => {
            const { data } = await db.from('users').select('workspace_id').eq('id', session.user.id).single()
            return data
        },
        { revalidate: 300, tags: [cacheTags.user(session.user.id)] }
    )

    const clients = await cachedFetch(
        `pipeline-stats-${profile?.workspace_id}`, token,
        async (db) => {
            const { data } = await db.from('clients').select('stage, deal_value').eq('workspace_id', profile?.workspace_id)
            return data ?? []
        },
        { revalidate: 60, tags: [cacheTags.pipeline(profile?.workspace_id ?? '')] }
    )

    const stageStats: Record<number, { count: number; value: number }> = {}
    for (const c of clients) {
        if (!stageStats[c.stage]) stageStats[c.stage] = { count: 0, value: 0 }
        stageStats[c.stage].count++
        stageStats[c.stage].value += c.deal_value || 0
    }

    const totalClients = clients.length
    const totalValue = clients.reduce((sum, c) => sum + (c.deal_value || 0), 0)
    const activeClients = clients.filter(c => c.stage >= 6 && c.stage <= 11).length
    const groups = ['Lead', 'Prospect', 'Client', 'Archived']

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
                    <p className="text-muted-foreground mt-1">Click any stage to manage clients in that stage.</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                        <p className="text-muted-foreground text-xs">Total Clients</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{activeClients}</p>
                        <p className="text-muted-foreground text-xs">Active</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            <p className="text-2xl font-bold text-primary">{(totalValue / 1000).toFixed(1)}k</p>
                        </div>
                        <p className="text-muted-foreground text-xs">Pipeline Value</p>
                    </div>
                </div>
            </div>

            {groups.map(group => {
                const groupStages = PIPELINE_STAGES.filter(s => s.statusGroup === group)
                const colors = groupColors[group]
                return (
                    <div key={group}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${colors.badge}`}>{group}</span>
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">
                                {groupStages.reduce((sum, s) => sum + (stageStats[s.id]?.count || 0), 0)} clients
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {groupStages.map(stage => {
                                const Icon = stageIcons[stage.id] || Users
                                const stats = stageStats[stage.id] || { count: 0, value: 0 }
                                return (
                                    <Link key={stage.id} href={`/pipeline/${stage.id}`}
                                        className={`group relative flex flex-col p-5 rounded-xl border bg-gradient-to-br ${colors.bg} ${colors.border} transition-all duration-300 hover:shadow-premium hover:-translate-y-0.5 cursor-pointer`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-background/80" style={{ boxShadow: `0 0 0 1px ${colors.accent}30` }}>
                                                <Icon className={`h-5 w-5 ${colors.text}`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">#{stage.id}</span>
                                        </div>
                                        <h3 className="font-bold text-sm text-foreground leading-tight mb-1">{stage.name}</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug mb-4 line-clamp-2">{stage.description}</p>
                                        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm font-bold">{stats.count}</span>
                                                <span className="text-xs text-muted-foreground">{stats.count === 1 ? 'client' : 'clients'}</span>
                                            </div>
                                            {stats.value > 0 && <span className={`text-xs font-semibold ${colors.text}`}>₹{stats.value.toLocaleString('en-IN')}</span>}
                                        </div>
                                        <ArrowRight className={`absolute right-4 bottom-4 h-4 w-4 ${colors.text} opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-200`} />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
