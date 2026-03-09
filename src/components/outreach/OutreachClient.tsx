'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { LogOutreachDialog } from './LogOutreachDialog'
import { MessageSquare, Search, Shield } from 'lucide-react'
import { OutreachLog, Channel, OutreachStatus } from './types'
import { OutreachTable } from './OutreachTable'
import { OutreachFilters } from './OutreachFilters'
import { EditLogDialog, DeleteLogDialog } from './OutreachDialogs'

interface Props {
    logs: OutreachLog[]
    clients: { id: string; name: string }[]
    isAdmin: boolean
}

export function OutreachClient({ logs: initialLogs, clients, isAdmin }: Props) {
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

    const clearFilters = useCallback(() => {
        setSearch('')
        setChannelFilter('')
        setStatusFilter('')
    }, [])

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
            <OutreachFilters
                search={search}
                setSearch={setSearch}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                filteredCount={filtered.length}
                totalCount={logs.length}
                activeFilters={activeFilters}
                clearFilters={clearFilters}
            />

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
                <OutreachTable
                    logs={filtered}
                    isAdmin={isAdmin}
                    isMounted={isMounted}
                    onEdit={openEdit}
                    onDelete={openDelete}
                />
            )}

            {/* Dialogs */}
            <EditLogDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                log={logToEdit}
                channel={editChannel}
                setChannel={setEditChannel}
                status={editStatus}
                setStatus={setEditStatus}
                notes={editNotes}
                setNotes={setEditNotes}
                onSave={handleEdit}
                saving={saving}
            />

            <DeleteLogDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                log={logToDelete}
                onDelete={handleDelete}
                deleting={deleting}
            />
        </div>
    )
}
