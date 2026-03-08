'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PipelineStage } from '@/lib/pipeline'
import { ClientData } from '@/store/pipelineStore'
import { ClientCard } from './ClientCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

export function PipelineColumn({
    stage,
    clients
}: {
    stage: PipelineStage
    clients: ClientData[]
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id.toString(),
        data: { stageId: stage.id }
    })

    const totalValue = clients.reduce((sum, c) => sum + c.deal_value, 0)

    return (
        <div className="flex h-full w-[300px] flex-col flex-shrink-0 bg-muted/30 border-r border-border">
            {/* Column Header */}
            <div className="flex flex-col gap-1 p-3 border-b border-border bg-background sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="font-semibold text-sm truncate" title={stage.name}>
                            {stage.name}
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                        {clients.length}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(totalValue)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted" title="Add Client" onClick={() => {/* Future Add Drawer */ }}>
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-2 transition-colors ${isOver ? 'bg-primary/5' : ''}`}
            >
                <div className="flex flex-col gap-2 min-h-full">
                    <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {clients.map((client) => (
                            <ClientCard key={client.id} client={client} />
                        ))}
                    </SortableContext>
                </div>
            </div>
        </div>
    )
}
