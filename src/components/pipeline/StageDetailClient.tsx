'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Plus, Search, Users, IndianRupee,
    ChevronRight, Loader2
} from 'lucide-react'
import { Client } from './types'
import { StageClientCard } from './StageClientCard'
import { AddClientDialog, DeleteClientDialog, NoteDialog } from './StageDialogs'
import { useStageClients } from './hooks'

interface StageDetailClientProps {
    stageId: number
    isAdmin?: boolean
}

export function StageDetailClient({ stageId, isAdmin = false }: StageDetailClientProps) {
    const {
        stage, nextStage, clients, loading, submitting, form, setForm,
        handleAddClient, updateStatus, transferClient, handleDeleteClient, saveNote
    } = useStageClients(stageId)

    const [mounted, setMounted] = useState(false)
    const [search, setSearch] = useState('')
    const [addOpen, setAddOpen] = useState(false)
    const [noteOpen, setNoteOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [noteText, setNoteText] = useState('')

    useEffect(() => { setMounted(true) }, [])

    const filtered = useMemo(() => clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    ), [clients, search])

    const totalValue = useMemo(() => clients.reduce((s, c) => s + (c.deal_value || 0), 0), [clients])

    if (!stage) return <div className="p-8 text-center text-muted-foreground">Stage not found.</div>

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{stage.name}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">{stage.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 w-48 bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-premium font-bold">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-lg">{clients.length}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">clients</span>
                </div>
                <div className="w-px h-6 bg-border mx-2" />
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <IndianRupee className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-lg">
                        ₹{totalValue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">total value</span>
                </div>
                {nextStage && (
                    <>
                        <div className="w-px h-6 bg-border mx-2" />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            Move to: <span className="text-foreground border px-2 py-0.5 rounded-full bg-muted/30">{nextStage.name}</span>
                            <ChevronRight className="h-3 w-3" />
                        </span>
                    </>
                )}
            </div>

            {/* Client Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-lg font-bold text-muted-foreground/80">Keep moving forward</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Add your first client to this stage to begin tracking.</p>
                    <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-6 font-bold shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Start Now
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(client => (
                        <StageClientCard
                            key={client.id}
                            client={client}
                            nextStage={nextStage}
                            mounted={mounted}
                            isAdmin={isAdmin}
                            onTransfer={transferClient}
                            onUpdateStatus={updateStatus}
                            onOpenNote={(c) => {
                                setSelectedClient(c)
                                setNoteText(c.stage_notes || '')
                                setNoteOpen(true)
                            }}
                            onDeleteRequest={(c) => {
                                setClientToDelete(c)
                                setDeleteOpen(true)
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <AddClientDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                stageName={stage.name}
                stageId={stageId}
                form={form}
                setForm={setForm}
                onSubmit={async (e) => {
                    const success = await handleAddClient(e)
                    if (success) setAddOpen(false)
                }}
                submitting={submitting}
            />

            <DeleteClientDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                client={clientToDelete}
                onDelete={async () => {
                    if (clientToDelete) {
                        const success = await handleDeleteClient(clientToDelete.id, clientToDelete.name)
                        if (success) setDeleteOpen(false)
                    }
                }}
                submitting={submitting}
            />

            <NoteDialog
                open={noteOpen}
                onOpenChange={setNoteOpen}
                clientName={selectedClient?.name}
                stageName={stage.name}
                noteText={noteText}
                setNoteText={setNoteText}
                onSave={async () => {
                    if (selectedClient) {
                        const success = await saveNote(selectedClient.id, noteText)
                        if (success) setNoteOpen(false)
                    }
                }}
                submitting={submitting}
            />
        </div>
    )
}
