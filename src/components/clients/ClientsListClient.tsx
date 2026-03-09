'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PIPELINE_STAGES, type PipelineStage } from '@/lib/pipeline'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import {
    Users, Search, IndianRupee, TrendingUp,
    MoreHorizontal, Trash2, ArrowRight, Globe,
    Phone, Mail, Building2, Filter, LayoutGrid,
    AlignJustify, AlertTriangle, Loader2, ChevronRight,
    X, SlidersHorizontal
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Client {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    website: string | null
    stage: number
    deal_value: number
    pipeline_status: string | null
    stage_notes: string | null
    updated_at: string
    created_at: string
}

interface Stats {
    totalValue: number
    totalClients: number
    activeClients: number
}

interface Props {
    clients: Client[]
    stages: PipelineStage[]
    stats: Stats
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    replied: { label: 'Replied', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    meeting_scheduled: { label: 'Meeting Set', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    qualified: { label: 'Qualified ✓', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    proposal_sent: { label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    negotiating: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    won: { label: 'Won 🎉', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    lost: { label: 'Lost', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
}

const GROUP_COLORS: Record<string, string> = {
    Lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Prospect: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Client: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function getStatus(val: string | null) {
    return STATUS_MAP[val ?? 'new'] ?? STATUS_MAP.new
}

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortKey = 'updated_at' | 'created_at' | 'name' | 'deal_value' | 'stage'

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
    { label: 'Last Updated', value: 'updated_at' },
    { label: 'Date Added', value: 'created_at' },
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Deal Value', value: 'deal_value' },
    { label: 'Stage', value: 'stage' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientsListClient({ clients: initialClients, stages, stats }: Props) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    // View & filter state
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState<number | null>(null)
    const [groupFilter, setGroupFilter] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortKey>('updated_at')
    const [showFilters, setShowFilters] = useState(false)

    // Client list (local mutations for instant feedback)
    const [clients, setClients] = useState<Client[]>(initialClients)

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const [deleting, setDeleting] = useState(false)

    // ── Filters ──────────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        let list = [...clients]

        // Text search — name, company, email
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.company?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
            )
        }

        // Stage group filter
        if (groupFilter) {
            const ids = stages.filter(s => s.statusGroup === groupFilter).map(s => s.id)
            list = list.filter(c => ids.includes(c.stage))
        }

        // Specific stage filter
        if (stageFilter !== null) {
            list = list.filter(c => c.stage === stageFilter)
        }

        // Sort
        list.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            if (sortBy === 'deal_value') return (b.deal_value || 0) - (a.deal_value || 0)
            if (sortBy === 'stage') return a.stage - b.stage
            if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })

        return list
    }, [clients, search, stageFilter, groupFilter, sortBy, stages])

    const activeFilterCount = [search, stageFilter, groupFilter].filter(Boolean).length

    // ── Handlers ─────────────────────────────────────────────────────────────

    const openDelete = useCallback((client: Client) => {
        setClientToDelete(client)
        setDeleteOpen(true)
    }, [])

    async function handleDelete() {
        if (!clientToDelete) return
        setDeleting(true)
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientToDelete.id)

        if (error) {
            toast.error('Failed to delete client')
        } else {
            toast.success(`${clientToDelete.name} removed`)
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id))
            setDeleteOpen(false)
            setClientToDelete(null)
        }
        setDeleting(false)
    }

    async function transferClient(client: Client, newStageId: number) {
        if (client.stage === newStageId) return
        const newStage = stages.find(s => s.id === newStageId)

        const { error } = await supabase
            .from('clients')
            .update({ stage: newStageId, pipeline_status: 'new' })
            .eq('id', client.id)

        if (error) {
            toast.error('Failed to transfer client')
        } else {
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, stage: newStageId, pipeline_status: 'new' } : c))

            // Log activity
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('activity_log').insert({
                    client_id: client.id,
                    action_type: 'stage_change',
                    description: `Transferred to ${newStage?.name || newStageId}`,
                })
            }

            toast.success(`${client.name} moved to ${newStage?.name || 'new stage'}`)
        }
    }

    function clearFilters() {
        setSearch('')
        setStageFilter(null)
        setGroupFilter(null)
        setSortBy('updated_at')
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        All clients across every pipeline stage in your workspace.
                    </p>
                </div>
                <Link href="/pipeline">
                    <Button className="gap-2 shadow-sm">
                        <ArrowRight className="h-4 w-4" />
                        Go to Pipeline
                    </Button>
                </Link>
            </div>

            {/* ── KPI Strip ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{stats.totalClients}</p>
                        <p className="text-xs text-muted-foreground font-medium">Total Clients</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.activeClients}</p>
                        <p className="text-xs text-muted-foreground font-medium">Active Clients</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <IndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-600">
                            ₹{stats.totalValue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Total Pipeline Value</p>
                    </div>
                </div>
            </div>

            {/* ── Filter/Search Bar ──────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, company, email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 relative"
                        onClick={() => setShowFilters(v => !v)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                            {SORT_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={sortBy === opt.value ? 'font-semibold text-primary' : ''}
                                >
                                    {opt.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="List view"
                        >
                            <AlignJustify className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Results count */}
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filtered.length} of {clients.length} clients
                    </span>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in duration-200">
                        {/* Stage Group filter */}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group:</span>
                        {['Lead', 'Prospect', 'Client', 'Archived'].map(g => (
                            <button
                                key={g}
                                onClick={() => setGroupFilter(groupFilter === g ? null : g)}
                                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${groupFilter === g
                                    ? GROUP_COLORS[g] + ' border-transparent'
                                    : 'border-border bg-background hover:bg-muted/50'
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-border mx-1" />
                        {/* Stage filter */}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage:</span>
                        <select
                            value={stageFilter ?? ''}
                            onChange={e => setStageFilter(e.target.value ? Number(e.target.value) : null)}
                            className="text-xs border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">All Stages</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" /> Clear all
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Client List / Empty ────────────────────────────────────── */}
            {clients.length === 0 ? (
                <EmptyAll />
            ) : filtered.length === 0 ? (
                <EmptySearch onClear={clearFilters} />
            ) : view === 'grid' ? (
                <GridView clients={filtered} stages={stages} onDelete={openDelete} onTransfer={transferClient} router={router} />
            ) : (
                <ListView clients={filtered} stages={stages} onDelete={openDelete} onTransfer={transferClient} router={router} />
            )}

            {/* ── Delete Confirmation ─────────────────────────────────────── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Client
                        </DialogTitle>
                        <DialogDescription>
                            Permanently delete <strong>{clientToDelete?.name}</strong>?
                            This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Permanently
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({ clients, stages, onDelete, onTransfer, router }: {
    clients: Client[]
    stages: PipelineStage[]
    onDelete: (c: Client) => void
    onTransfer: (c: Client, stageId: number) => void
    router: ReturnType<typeof useRouter>
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map(client => {
                const stage = stages.find(s => s.id === client.stage)
                const status = getStatus(client.pipeline_status)
                const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                    <div
                        key={client.id}
                        className="group relative flex flex-col p-5 rounded-xl border bg-card hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/clients/${client.id}`)}
                    >
                        {/* Top */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm leading-tight truncate">{client.name}</p>
                                    {client.company && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                            <Building2 className="h-3 w-3 flex-shrink-0" />
                                            {client.company}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions menu */}
                            <div onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        }
                                    />
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                                            View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/pipeline/${client.stage}`)}>
                                            <ArrowRight className="h-4 w-4 mr-1.5" />
                                            View in Pipeline
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger className="gap-2">
                                                <ArrowRight className="h-4 w-4 text-emerald-600" />
                                                Transfer to Stage
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="w-48">
                                                {stages.map(s => (
                                                    <DropdownMenuItem
                                                        key={s.id}
                                                        disabled={s.id === client.stage}
                                                        onClick={() => onTransfer(client, s.id)}
                                                    >
                                                        <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                                        {s.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive font-semibold"
                                            onClick={() => onDelete(client)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Delete Client
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Contact info */}
                        <div className="space-y-1.5 mb-4">
                            {client.email && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    {client.email}
                                </p>
                            )}
                            {client.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                    {client.phone}
                                </p>
                            )}
                            {client.website && (
                                <a
                                    href={client.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline truncate"
                                >
                                    <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                    {client.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                                {status.label}
                            </span>
                            {stage && (
                                <span
                                    className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: stage.color + '20', color: stage.color }}
                                >
                                    {stage.name}
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-600">
                                ₹{(client.deal_value || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Hover arrow */}
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                )
            })}
        </div>
    )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ clients, stages, onDelete, onTransfer, router }: {
    clients: Client[]
    stages: PipelineStage[]
    onDelete: (c: Client) => void
    onTransfer: (c: Client, stageId: number) => void
    router: ReturnType<typeof useRouter>
}) {
    return (
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/30 border-b border-border/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:block">Stage</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:block">Status</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:block">Deal Value</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:block">Updated</span>
                <span aria-hidden />
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/40">
                {clients.map(client => {
                    const stage = stages.find(s => s.id === client.stage)
                    const status = getStatus(client.pipeline_status)
                    const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                    return (
                        <div
                            key={client.id}
                            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/clients/${client.id}`)}
                        >
                            {/* Name + company */}
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                        {client.name}
                                    </p>
                                    {client.company && (
                                        <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stage */}
                            <div className="hidden md:flex items-center">
                                {stage && (
                                    <span
                                        className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: stage.color + '20', color: stage.color }}
                                    >
                                        {stage.name}
                                    </span>
                                )}
                            </div>

                            {/* Status */}
                            <div className="hidden lg:flex">
                                <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>

                            {/* Deal Value */}
                            <div className="hidden lg:block">
                                <span className="text-sm font-bold text-emerald-600 font-mono">
                                    ₹{(client.deal_value || 0).toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Updated */}
                            <div className="hidden xl:block">
                                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                    {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
                                </span>
                            </div>

                            {/* Actions */}
                            <div onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        }
                                    />
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                                            View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/pipeline/${client.stage}`)}>
                                            <ArrowRight className="h-4 w-4 mr-1.5" />
                                            View in Pipeline
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger className="gap-2">
                                                <ArrowRight className="h-4 w-4 text-emerald-600" />
                                                Transfer to Stage
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="w-48">
                                                {stages.map(s => (
                                                    <DropdownMenuItem
                                                        key={s.id}
                                                        disabled={s.id === client.stage}
                                                        onClick={() => onTransfer(client, s.id)}
                                                    >
                                                        <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                                        {s.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive font-semibold"
                                            onClick={() => onDelete(client)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Delete Client
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyAll() {
    return (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold text-foreground">No clients yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first client from the Pipeline page.</p>
            <Link href="/pipeline" className="mt-4 inline-block">
                <Button className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Go to Pipeline
                </Button>
            </Link>
        </div>
    )
}

function EmptySearch({ onClear }: { onClear: () => void }) {
    return (
        <div className="text-center py-16 border border-border rounded-xl">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No clients match your filters</p>
            <button
                onClick={onClear}
                className="mt-3 text-xs text-primary hover:underline font-semibold"
            >
                Clear all filters
            </button>
        </div>
    )
}
