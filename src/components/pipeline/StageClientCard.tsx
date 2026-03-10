'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
    MoreHorizontal, ArrowRight, Trash2, Building2, Mail, Phone,
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Client, getStatusStyle, STATUS_OPTIONS } from './types'
import { PIPELINE_STAGES, PipelineStage } from '@/lib/pipeline'

interface StageClientCardProps {
    client: Client
    nextStage: PipelineStage | undefined
    mounted: boolean
    isAdmin?: boolean
    onTransfer: (client: Client, newStageId: number) => void
    onUpdateStatus: (clientId: string, status: string) => void
    onOpenNote: (client: Client) => void
    onDeleteRequest: (client: Client) => void
}

export const StageClientCard = React.memo(({
    client,
    nextStage,
    mounted,
    isAdmin = false,
    onTransfer,
    onUpdateStatus,
    onOpenNote,
    onDeleteRequest,
}: StageClientCardProps) => {
    const router = useRouter()
    const status = getStatusStyle(client.pipeline_status || 'new')

    return (
        <div className="group relative flex flex-col p-5 rounded-xl border bg-card hover:bg-card/80 shadow-sm hover:shadow-premium transition-all duration-200">
            {/* Top Row */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {client.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>{client.name}</p>
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
                            <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 focus:outline-none">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                            View Client Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenNote(client)}>
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
                                            onTransfer(client, s.id)
                                        }}
                                    >
                                        <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                        {s.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        {isAdmin && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive font-semibold"
                                    onClick={() => onDeleteRequest(client)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete Client
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Status Tag */}
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button type="button" className="w-fit focus:outline-none">
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
                            onClick={() => onUpdateStatus(client.id, opt.value)}
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
                    onClick={() => onTransfer(client, nextStage.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-dashed border-border hover:border-emerald-400 transition-all duration-200"
                >
                    Move to {nextStage.name}
                    <ArrowRight className="h-3 w-3" />
                </button>
            )}
        </div>
    )
})

StageClientCard.displayName = 'StageClientCard'
