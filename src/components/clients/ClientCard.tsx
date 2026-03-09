'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'
import {
    MoreHorizontal, Trash2, ArrowRight, Globe,
    Phone, Mail, Building2, ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { type PipelineStage } from '@/lib/pipeline'
import { Client, getStatus } from './types'

interface ClientCardProps {
    client: Client
    stages: PipelineStage[]
    onDelete: (c: Client) => void
    onTransfer: (c: Client, stageId: number) => void
}

export const ClientCard = memo(function ClientCard({ client, stages, onDelete, onTransfer }: ClientCardProps) {
    const router = useRouter()
    const stage = stages.find(s => s.id === client.stage)
    const status = getStatus(client.pipeline_status)
    const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div
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

                <div onClick={e => e.stopPropagation()}>
                    <ClientActionsMenu client={client} stages={stages} onDelete={onDelete} onTransfer={onTransfer} router={router} />
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
})

// ─── Shared Actions Dropdown ──────────────────────────────────────────────────

export function ClientActionsMenu({ client, stages, onDelete, onTransfer, router }: ClientCardProps & { router: ReturnType<typeof useRouter> }) {
    return (
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
    )
}
