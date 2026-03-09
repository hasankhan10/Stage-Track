'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClientData } from '@/store/pipelineStore'
import { getStageById } from '@/lib/pipeline'
import { formatCurrency } from '@/lib/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, Building2, Mail, Phone, Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function ClientCard({ client }: { client: ClientData }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: client.id, data: { ...client } })

    const stage = getStageById(client.stage)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const assignedInitial = client.assigned_user?.name?.charAt(0) || '?'

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md transition-all duration-200 ${isDragging ? 'z-50 ring-2 ring-primary border-primary shadow-xl scale-[1.02]' : ''}`}
        >
            {/* Header: Name and Stage Badge */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {client.name}
                </h4>
                <Badge
                    variant="secondary"
                    className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0 border leading-tight"
                    style={{
                        backgroundColor: `${stage?.color}10`,
                        color: stage?.color,
                        borderColor: `${stage?.color}30`
                    }}
                >
                    {stage?.statusGroup}
                </Badge>
            </div>

            {/* Client Info Grid */}
            <div className="space-y-1.5">
                {client.company && (
                    <div className="flex items-center text-[11px] text-muted-foreground font-medium">
                        <Building2 className="mr-2 h-3 w-3 text-muted-foreground/70" />
                        <span className="truncate">{client.company}</span>
                    </div>
                )}

                {client.email && (
                    <div className="flex items-center text-[11px] text-muted-foreground">
                        <Mail className="mr-2 h-3 w-3 text-muted-foreground/70" />
                        <span className="truncate">{client.email}</span>
                    </div>
                )}

                {client.phone && (
                    <div className="flex items-center text-[11px] text-muted-foreground">
                        <Phone className="mr-2 h-3 w-3 text-muted-foreground/70" />
                        <span>{client.phone}</span>
                    </div>
                )}

                {client.website && (
                    <div className="flex items-center text-[11px] text-muted-foreground group/link">
                        <Globe className="mr-2 h-3 w-3 text-muted-foreground/70" />
                        <span className="truncate flex-1">{client.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="ml-1 h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent my-0.5" />

            {/* Footer: Deal Value, Days in Stage, & Assigned User */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Potential Value</span>
                    <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(client.deal_value)}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                            <Clock className="mr-1 h-2.5 w-2.5" />
                            <span suppressHydrationWarning>{client.daysInStage}d</span>
                        </div>
                    </div>

                    <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border bg-muted">
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold shadow-inner">
                            {assignedInitial}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Subtle Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
        </div>
    )
}
