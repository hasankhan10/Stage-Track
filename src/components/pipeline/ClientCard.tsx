'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClientData } from '@/store/pipelineStore'
import { getStageById } from '@/lib/pipeline'
import { formatCurrency } from '@/lib/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, Building2 } from 'lucide-react'

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
            className={`relative flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${isDragging ? 'z-50 ring-2 ring-primary' : ''}`}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm leading-tight">{client.name}</h4>
                <Badge variant="outline" style={{ borderColor: stage?.color, color: stage?.color }} className="text-[10px] px-1.5 py-0 border leading-tight">
                    {stage?.statusGroup}
                </Badge>
            </div>

            {client.company && (
                <div className="flex items-center text-xs text-muted-foreground">
                    <Building2 className="mr-1 h-3 w-3" />
                    <span className="truncate">{client.company}</span>
                </div>
            )}

            <div className="mt-2 text-sm font-medium text-foreground">
                {formatCurrency(client.deal_value)}
            </div>

            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span suppressHydrationWarning>{client.daysInStage}d</span>
                </div>

                <Avatar className="h-6 w-6 border bg-muted">
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {assignedInitial}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}
