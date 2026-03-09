'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { type PipelineStage } from '@/lib/pipeline'
import { Client, getStatus } from './types'
import { ClientActionsMenu } from './ClientCard'

interface ViewProps {
    clients: Client[]
    stages: PipelineStage[]
    onDelete: (c: Client) => void
    onTransfer: (c: Client, stageId: number) => void
}

// ─── Grid View ────────────────────────────────────────────────────────────────

import { ClientCard } from './ClientCard'

export const GridView = memo(function GridView({ clients, stages, onDelete, onTransfer }: ViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map(client => (
                <ClientCard key={client.id} client={client} stages={stages} onDelete={onDelete} onTransfer={onTransfer} />
            ))}
        </div>
    )
})

// ─── List View ────────────────────────────────────────────────────────────────

export const ListView = memo(function ListView({ clients, stages, onDelete, onTransfer }: ViewProps) {
    const router = useRouter()
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
                                <ClientActionsMenu client={client} stages={stages} onDelete={onDelete} onTransfer={onTransfer} router={router} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

// ─── Empty States ─────────────────────────────────────────────────────────────

export function EmptyAll() {
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

export function EmptySearch({ onClear }: { onClear: () => void }) {
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
