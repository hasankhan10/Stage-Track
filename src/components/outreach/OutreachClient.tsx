'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOutreachDialog } from './LogOutreachDialog'
import {
    MessageSquare, Mail, Phone, ExternalLink,
    MoreHorizontal, Pencil, Trash2, AlertTriangle,
    Loader2, Search, X, Filter, SlidersHorizontal, Shield,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = 'Email' | 'LinkedIn' | 'Call' | 'Meeting' | 'Other'
type OutreachStatus =
    | 'Sent' | 'Replied' | 'Bounced' | 'Meeting Set'
    | 'No Answer' | 'Interested' | 'Not Interested'

interface OutreachLog {
    id: string
    client_id: string
    channel: Channel
    status: OutreachStatus
    notes: string | null
    contacted_at: string
    clients: { id: string; name: string; company: string | null } | null
}

interface Props {
    logs: OutreachLog[]
    clients: { id: string; name: string }[]
    isAdmin: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = ['Email', 'LinkedIn', 'Call', 'Meeting', 'Other']

const ALL_STATUSES: OutreachStatus[] = [
    'Sent', 'Replied', 'Bounced', 'Meeting Set',
    'No Answer', 'Interested', 'Not Interested',
]

function getChannelIcon(channel: string) {
    if (channel === 'Email') return <Mail className="h-3.5 w-3.5" />
    if (channel === 'Call') return <Phone className="h-3.5 w-3.5" />
    if (channel === 'LinkedIn') return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
    return <MessageSquare className="h-3.5 w-3.5" />
}

function getStatusStyle(status: string): string {
    if (['Replied', 'Meeting Set', 'Interested'].includes(status))
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    if (['Bounced', 'Not Interested'].includes(status))
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    return 'bg-muted text-muted-foreground'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OutreachClient({ logs: initialLogs, clients, isAdmin }: Props) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const [logs, setLogs] = useState<OutreachLog[]>(initialLogs)
    const [search, setSearch] = useState('')
    const [channelFilter, setChannelFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [showFilters, setShowFilters] = useState(false)

    // Delete state
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [logToDelete, setLogToDelete] = useState<OutreachLog | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Edit state
    const [editOpen, setEditOpen] = useState(false)
    const [logToEdit, setLogToEdit] = useState<OutreachLog | null>(null)
    const [editChannel, setEditChannel] = useState<Channel>('Email')
    const [editStatus, setEditStatus] = useState<OutreachStatus>('Sent')
    const [editNotes, setEditNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // ── Filtered list ─────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        return logs.filter(log => {
            const q = search.toLowerCase()
            const matchSearch =
                !q ||
                (log.clients?.name?.toLowerCase().includes(q) ?? false) ||
                (log.clients?.company?.toLowerCase().includes(q) ?? false) ||
                (log.notes?.toLowerCase().includes(q) ?? false)
            const matchChannel = !channelFilter || log.channel === channelFilter
            const matchStatus = !statusFilter || log.status === statusFilter
            return matchSearch && matchChannel && matchStatus
        })
    }, [logs, search, channelFilter, statusFilter])

    const activeFilters = [search, channelFilter, statusFilter].filter(Boolean).length

    function clearFilters() {
        setSearch('')
        setChannelFilter('')
        setStatusFilter('')
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    const openDelete = useCallback((log: OutreachLog) => {
        setLogToDelete(log)
        setDeleteOpen(true)
    }, [])

    async function handleDelete() {
        if (!logToDelete) return
        setDeleting(true)
        const { error } = await supabase
            .from('outreach_log')
            .delete()
            .eq('id', logToDelete.id)

        if (error) {
            toast.error('Failed to delete log entry')
        } else {
            toast.success('Log entry deleted')
            setLogs(prev => prev.filter(l => l.id !== logToDelete.id))
            setDeleteOpen(false)
            setLogToDelete(null)
        }
        setDeleting(false)
    }

    // ── Edit ──────────────────────────────────────────────────────────────────

    const openEdit = useCallback((log: OutreachLog) => {
        setLogToEdit(log)
        setEditChannel(log.channel)
        setEditStatus(log.status)
        setEditNotes(log.notes ?? '')
        setEditOpen(true)
    }, [])

    async function handleEdit() {
        if (!logToEdit) return
        setSaving(true)
        const { error } = await supabase
            .from('outreach_log')
            .update({
                channel: editChannel,
                status: editStatus,
                notes: editNotes.trim() || null,
            })
            .eq('id', logToEdit.id)

        if (error) {
            toast.error('Failed to update log entry')
        } else {
            toast.success('Log entry updated')
            setLogs(prev => prev.map(l =>
                l.id === logToEdit.id
                    ? { ...l, channel: editChannel, status: editStatus, notes: editNotes.trim() || null }
                    : l
            ))
            setEditOpen(false)
            setLogToEdit(null)
        }
        setSaving(false)
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outreach Logs</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Track all communication across your pipeline.
                        {isAdmin && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                <Shield className="h-3 w-3" /> Admin view
                            </span>
                        )}
                    </p>
                </div>
                <LogOutreachDialog clients={clients} />
            </div>

            {/* Filter bar */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search client, company, notes…"
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
                        {activeFilters > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                                {activeFilters}
                            </span>
                        )}
                    </Button>

                    <span className="text-sm text-muted-foreground ml-auto">
                        {filtered.length} of {logs.length} entries
                    </span>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel:</span>
                            <div className="flex gap-1.5 flex-wrap">
                                {CHANNELS.map(ch => (
                                    <button
                                        key={ch}
                                        onClick={() => setChannelFilter(channelFilter === ch ? '' : ch)}
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${channelFilter === ch
                                            ? 'bg-primary text-primary-foreground border-transparent'
                                            : 'border-border bg-background hover:bg-muted/50'
                                            }`}
                                    >
                                        {ch}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-5 bg-border" />

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="text-xs border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All Statuses</option>
                                {ALL_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {activeFilters > 0 && (
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

            {/* Table / Empty */}
            {logs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold text-muted-foreground">No outreach logged yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Click &ldquo;Log Outreach&rdquo; to record your first touchpoint.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-border rounded-xl">
                    <Search className="h-7 w-7 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No entries match your filters</p>
                    <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline font-semibold">
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">Client</th>
                                    <th className="px-5 py-3.5">Channel</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 hidden md:table-cell">Notes</th>
                                    <th className="px-5 py-3.5 text-right">Date</th>
                                    {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filtered.map(log => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                                        {/* Client */}
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/clients/${log.client_id}`}
                                                className="font-semibold text-foreground hover:text-primary hover:underline flex items-center gap-1.5 transition-colors"
                                            >
                                                {log.clients?.name ?? 'Unknown'}
                                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                            </Link>
                                            {log.clients?.company && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{log.clients.company}</p>
                                            )}
                                        </td>

                                        {/* Channel */}
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                {getChannelIcon(log.channel)}
                                                {log.channel}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusStyle(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>

                                        {/* Notes */}
                                        <td className="px-5 py-4 hidden md:table-cell max-w-[240px]">
                                            <p className="text-xs text-muted-foreground truncate">
                                                {log.notes ?? <span className="opacity-40">—</span>}
                                            </p>
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground">
                                                {isMounted ? new Date(log.contacted_at).toLocaleString([], {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                }) : '...'}
                                            </span>
                                        </td>

                                        {/* Admin actions */}
                                        {isAdmin && (
                                            <td className="px-5 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => openEdit(log)}
                                                            className="gap-2"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Edit Entry
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openDelete(log)}
                                                            className="text-destructive focus:text-destructive font-semibold gap-2"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete Entry
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Edit Dialog (Admin only) ──────────────────────────────── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-primary" />
                            Edit Log Entry
                        </DialogTitle>
                        <DialogDescription>
                            Update the channel, outcome, or notes for this outreach entry.
                            {logToEdit && (
                                <span className="block mt-1 font-semibold text-foreground">
                                    Client: {logToEdit.clients?.name ?? 'Unknown'}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Channel</label>
                                <select
                                    value={editChannel}
                                    onChange={e => setEditChannel(e.target.value as Channel)}
                                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Status / Outcome</label>
                                <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value as OutreachStatus)}
                                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Notes</label>
                            <textarea
                                className="w-full min-h-[90px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="What was discussed?"
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm Dialog (Admin only) ───────────────────── */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Log Entry
                        </DialogTitle>
                        <DialogDescription>
                            Permanently delete this outreach entry for{' '}
                            <strong>{logToDelete?.clients?.name ?? 'this client'}</strong>?
                            This cannot be undone.
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
                            Delete Entry
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
