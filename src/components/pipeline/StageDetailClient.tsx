'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
    Plus, ArrowRight, Search, Users, IndianRupee,
    MoreHorizontal, ChevronRight, Loader2, Trash2, Globe, AlertTriangle,
    Building2, Mail, Phone
} from 'lucide-react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

// Status options per stage context
const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { value: 'replied', label: 'Replied', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    { value: 'meeting_scheduled', label: 'Meeting Set', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    { value: 'qualified', label: 'Qualified ✓', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    { value: 'won', label: 'Won 🎉', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    { value: 'lost', label: 'Lost', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
]

function getStatusStyle(value: string) {
    return STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0]
}

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

interface StageDetailClientProps {
    stageId: number
}

export function StageDetailClient({ stageId }: StageDetailClientProps) {
    const stage = PIPELINE_STAGES.find(s => s.id === stageId)
    const nextStage = PIPELINE_STAGES.find(s => s.id === stageId + 1)

    const [mounted, setMounted] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [addOpen, setAddOpen] = useState(false)
    const [noteOpen, setNoteOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [noteText, setNoteText] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Add Client form
    const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', website: '', deal_value: '' })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    const fetchClients = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, company, email, phone, website, stage, deal_value, pipeline_status, stage_notes, updated_at, created_at')
            .eq('stage', stageId)
            .order('updated_at', { ascending: false })

        if (error) toast.error('Failed to load clients')
        else setClients(data || [])
        setLoading(false)
    }, [stageId, supabase])

    useEffect(() => { setMounted(true) }, [])
    useEffect(() => { fetchClients() }, [fetchClients])

    async function handleAddClient(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Client name is required')
            return
        }
        setSubmitting(true)
        try {
            // Get current user's workspace_id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', user.id)
                .single()

            const { error } = await supabase.from('clients').insert({
                name: form.name.trim(),
                company: form.company.trim() || null,
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                website: form.website.trim() || null,
                deal_value: Math.round(parseFloat(form.deal_value) || 0),
                stage: stageId,
                workspace_id: profile?.workspace_id,
                pipeline_status: 'new',
            })

            if (error) throw error
            toast.success(`${form.name} added to ${stage?.name}`)
            setForm({ name: '', company: '', email: '', phone: '', website: '', deal_value: '' })
            setAddOpen(false)
            fetchClients()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function updateStatus(clientId: string, status: string) {
        const { error } = await supabase
            .from('clients')
            .update({ pipeline_status: status })
            .eq('id', clientId)

        if (error) { toast.error('Failed to update status'); return }
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, pipeline_status: status } : c))
        toast.success('Status updated')
    }

    async function transferClient(client: Client, newStageId: number) {
        if (client.stage === newStageId) return
        const newStage = PIPELINE_STAGES.find(s => s.id === newStageId)
        if (!newStage) return

        const { error } = await supabase
            .from('clients')
            .update({ stage: newStageId, pipeline_status: 'new' })
            .eq('id', client.id)

        if (error) { toast.error('Failed to transfer client'); return }

        // Log activity — include workspace_id for proper RLS scoping
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', user.id)
                .single()
            await supabase.from('activity_log').insert({
                client_id: client.id,
                action_type: 'stage_change',
                description: `Transferred from ${stage?.name} to ${newStage.name}`,
                workspace_id: profile?.workspace_id,
            })
        }

        toast.success(`${client.name} moved to ${newStage.name}!`)
        fetchClients()
    }

    async function handleDeleteClient() {
        if (!clientToDelete) return
        setSubmitting(true)
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientToDelete.id)

        if (error) {
            toast.error('Failed to delete client')
        } else {
            toast.success(`${clientToDelete.name} removed from pipeline`)
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id))
            setDeleteOpen(false)
            setClientToDelete(null)
        }
        setSubmitting(false)
    }

    async function saveNote() {
        if (!selectedClient) return
        setSubmitting(true)
        const { error } = await supabase
            .from('clients')
            .update({ stage_notes: noteText })
            .eq('id', selectedClient.id)

        if (error) toast.error('Failed to save note')
        else {
            toast.success('Note saved')
            setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, stage_notes: noteText } : c))
            setNoteOpen(false)
        }
        setSubmitting(false)
    }

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    )

    if (!stage) return <div className="p-8 text-center text-muted-foreground">Stage not found.</div>

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{stage.name}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">{stage.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 w-48"
                        />
                    </div>
                    <Button onClick={() => setAddOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{clients.length}</span>
                    <span className="text-sm text-muted-foreground">clients</span>
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">
                        ₹{clients.reduce((s, c) => s + (c.deal_value || 0), 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-muted-foreground">total value</span>
                </div>
                {nextStage && (
                    <>
                        <div className="w-px h-5 bg-border" />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            Next stage: <span className="font-semibold text-foreground">{nextStage.name}</span>
                            <ChevronRight className="h-3 w-3" />
                        </span>
                    </>
                )}
            </div>

            {/* Client Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No clients in this stage yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Client" to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(client => {
                        const status = getStatusStyle(client.pipeline_status || 'new')
                        return (
                            <div
                                key={client.id}
                                className="group relative flex flex-col p-5 rounded-xl border bg-card hover:bg-card/80 shadow-sm hover:shadow-premium transition-all duration-200"
                            >
                                {/* Top Row */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 flex-shrink-0">
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                                {client.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm leading-tight">{client.name}</p>
                                            <div className="space-y-0.5 mt-1">
                                                {client.company && (
                                                    <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                                                        <Building2 className="h-2.5 w-2.5" />
                                                        {client.company}
                                                    </p>
                                                )}
                                                {client.email && (
                                                    <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                                                        <Mail className="h-2.5 w-2.5" />
                                                        {client.email}
                                                    </p>
                                                )}
                                                {client.phone && (
                                                    <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                                                        <Phone className="h-2.5 w-2.5" />
                                                        {client.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            }
                                        />
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                                                View Client Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setSelectedClient(client)
                                                setNoteText(client.stage_notes || '')
                                                setNoteOpen(true)
                                            }}>
                                                Add / Edit Note
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="text-emerald-600 font-semibold gap-2">
                                                    <ArrowRight className="h-4 w-4" />
                                                    Transfer to Stage
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent className="w-48">
                                                    {PIPELINE_STAGES.map(s => (
                                                        <DropdownMenuItem
                                                            key={s.id}
                                                            disabled={s.id === client.stage}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                transferClient(client, s.id)
                                                            }}
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
                                                onClick={() => {
                                                    setClientToDelete(client)
                                                    setDeleteOpen(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete Client
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Status Tag */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <button type="button" className="w-fit">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </button>
                                        }
                                    />
                                    <DropdownMenuContent className="w-44">
                                        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Set Status</p>
                                        {STATUS_OPTIONS.map(opt => (
                                            <DropdownMenuItem
                                                key={opt.value}
                                                onClick={() => updateStatus(client.id, opt.value)}
                                                className="gap-2"
                                            >
                                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${opt.color.split(' ')[0]}`} />
                                                {opt.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Note */}
                                {client.stage_notes && (
                                    <p className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 line-clamp-2 italic">
                                        &ldquo;{client.stage_notes}&rdquo;
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-emerald-600">
                                        ₹{(client.deal_value || 0).toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                        {mounted ? formatDistanceToNow(new Date(client.updated_at), { addSuffix: true }) : '—'}
                                    </span>
                                </div>

                                {/* Move to next stage button */}
                                {nextStage && (
                                    <button
                                        type="button"
                                        onClick={() => transferClient(client, nextStage.id)}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-dashed border-border hover:border-emerald-400 transition-all duration-200"
                                    >
                                        Move to {nextStage.name}
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Client Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Client to {stage.name}</DialogTitle>
                        <DialogDescription>
                            This client will be added directly to the <strong>{stage.name}</strong> stage.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddClient} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                                <Input
                                    placeholder="Rahul Sharma"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1 block">Email</label>
                                <Input
                                    type="email"
                                    placeholder="rahul@example.com"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Company</label>
                                <Input
                                    placeholder="Infosys Ltd."
                                    value={form.company}
                                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Phone</label>
                                <Input
                                    placeholder="+91 98765 43210"
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1 block flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                    Website
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://infosys.com"
                                    value={form.website}
                                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                />
                            </div>
                            {stage.id >= 6 && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium mb-1 block flex items-center gap-1.5">
                                        <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                                        Deal Value
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="50000"
                                        value={form.deal_value || ''}
                                        onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add to {stage.name}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Client
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete <strong>{clientToDelete?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2 text-right space-x-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteClient}
                            disabled={submitting}
                            className="gap-2"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Note Dialog */}
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Stage Note — {selectedClient?.name}</DialogTitle>
                        <DialogDescription>Add a note about this client's progress in {stage.name}.</DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                        placeholder="E.g. Sent LinkedIn message on Monday. Awaiting reply..."
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                    />
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
                        <Button onClick={saveNote} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
