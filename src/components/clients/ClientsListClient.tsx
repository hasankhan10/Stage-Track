'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type PipelineStage } from '@/lib/pipeline'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { Client, Stats, SORT_OPTIONS, type SortKey } from './types'
import { GridView, ListView, EmptyAll, EmptySearch } from './ClientViews'
import { ClientStats } from './ClientStats'
import { ClientFilters } from './ClientFilters'
import { DeleteClientDialog } from './ClientDialogs'

interface Props {
    clients: Client[]
    stages: PipelineStage[]
    stats: Stats
}

export function ClientsListClient({ clients: initialClients, stages, stats }: Props) {
    const supabase = useMemo(() => createClient(), [])

    // View & filter state
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState<number | null>(null)
    const [groupFilter, setGroupFilter] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortKey>('updated_at')
    const [showFilters, setShowFilters] = useState(false)

    // Client list
    const [clients, setClients] = useState<Client[]>(initialClients)

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const [deleting, setDeleting] = useState(false)

    const filtered = useMemo(() => {
        let list = [...clients]

        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.company?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
            )
        }

        if (groupFilter) {
            const ids = stages.filter(s => s.statusGroup === groupFilter).map(s => s.id)
            list = list.filter(c => ids.includes(c.stage))
        }

        if (stageFilter !== null) {
            list = list.filter(c => c.stage === stageFilter)
        }

        list.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            if (sortBy === 'deal_value') return (b.deal_value || 0) - (a.deal_value || 0)
            if (sortBy === 'stage') return a.stage - b.stage
            if (sortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })

        return list
    }, [clients, search, stageFilter, groupFilter, sortBy, stages])

    const activeFilterCount = useMemo(() => [search, stageFilter, groupFilter].filter(Boolean).length, [search, stageFilter, groupFilter])

    const openDelete = useCallback((client: Client) => {
        setClientToDelete(client)
        setDeleteOpen(true)
    }, [])

    const handleDelete = useCallback(async () => {
        if (!clientToDelete) return
        setDeleting(true)
        const { error } = await supabase.from('clients').delete().eq('id', clientToDelete.id)
        if (error) {
            toast.error('Failed to delete client')
        } else {
            toast.success(`${clientToDelete.name} removed`)
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id))
            setDeleteOpen(false)
            setClientToDelete(null)
        }
        setDeleting(false)
    }, [clientToDelete, supabase])

    const transferClient = useCallback(async (client: Client, newStageId: number) => {
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
    }, [stages, supabase])

    const clearFilters = useCallback(() => {
        setSearch('')
        setStageFilter(null)
        setGroupFilter(null)
        setSortBy('updated_at')
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        All clients across every pipeline stage in your workspace.
                    </p>
                </div>
                <Link href="/pipeline">
                    <Button className="gap-2 shadow-sm focus:outline-none">
                        <ArrowRight className="h-4 w-4" />
                        Go to Pipeline
                    </Button>
                </Link>
            </div>

            {/* KPI Strip */}
            <ClientStats stats={stats} />

            {/* Filter/Search Bar */}
            <ClientFilters
                search={search}
                setSearch={setSearch}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                activeFilterCount={activeFilterCount}
                sortBy={sortBy}
                setSortBy={setSortBy}
                view={view}
                setView={setView}
                groupFilter={groupFilter}
                setGroupFilter={setGroupFilter}
                stageFilter={stageFilter}
                setStageFilter={setStageFilter}
                stages={stages}
                clearFilters={clearFilters}
                filteredCount={filtered.length}
                totalCount={clients.length}
            />

            {/* Client List / Empty */}
            {clients.length === 0 ? (
                <EmptyAll />
            ) : filtered.length === 0 ? (
                <EmptySearch onClear={clearFilters} />
            ) : view === 'grid' ? (
                <GridView clients={filtered} stages={stages} onDelete={openDelete} onTransfer={transferClient} />
            ) : (
                <ListView clients={filtered} stages={stages} onDelete={openDelete} onTransfer={transferClient} />
            )}

            {/* Delete Confirmation */}
            <DeleteClientDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                client={clientToDelete}
                onDelete={handleDelete}
                deleting={deleting}
            />
        </div>
    )
}
