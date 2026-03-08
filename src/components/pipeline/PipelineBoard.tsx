'use client'

import { useEffect, useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { PipelineColumn } from '@/components/pipeline/PipelineColumn'
import { ClientCard } from '@/components/pipeline/ClientCard'
import { ClientData, usePipelineStore } from '@/store/pipelineStore'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { BoardFilters } from '@/components/pipeline/BoardFilters'

import { Skeleton } from '@/components/ui/skeleton'

export function PipelineBoard() {
    const { clients, searchQuery, filterGroup, updateClientStage, setClients, setIsLoading, isLoading } = usePipelineStore()
    const [activeClient, setActiveClient] = useState<ClientData | null>(null)
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before dragging starts (prevents click issues)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        async function loadPipelineData() {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('clients')
                .select(`
          id, name, company, deal_value, stage, assigned_to, created_at, updated_at,
          users (
            name, email
          )
        `)

            if (error) {
                toast.error('Failed to load pipeline: ' + error.message)
            } else if (data) {
                const formatted = data.map(d => {
                    const userData = Array.isArray(d.users) ? d.users[0] : d.users;
                    return {
                        ...d,
                        assigned_user: userData ? {
                            name: (userData as any).name || '',
                            email: (userData as any).email || ''
                        } : undefined,
                        users: undefined,
                        daysInStage: Math.floor(Math.abs(Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24))
                    };
                }) as ClientData[]
                setClients(formatted)
            }
            setIsLoading(false)
        }

        loadPipelineData()
    }, [])

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveClient(null)

        if (!over) return

        const clientId = active.id as string

        // Find new stage ID from either the column or the card we dropped on
        let newStageId: number | undefined
        const overData = over.data.current

        if (overData?.stageId) {
            newStageId = overData.stageId // Dropped on column
        } else if (overData?.stage) {
            newStageId = overData.stage // Dropped on another card
        } else {
            // Fallback to parsing ID if data is missing
            const parsed = parseInt(over.id as string)
            if (!isNaN(parsed)) newStageId = parsed
        }

        const client = clients.find(c => c.id === clientId)

        if (!client || !newStageId || client.stage === newStageId) return

        const oldStage = client.stage

        // Optimistic UI update
        updateClientStage(clientId, newStageId)

        try {
            // DB Update
            const { error: updateError } = await supabase
                .from('clients')
                .update({ stage: newStageId })
                .eq('id', clientId)

            if (updateError) throw updateError

            // Log Activity
            await supabase.from('activity_log').insert({
                client_id: clientId,
                action_type: 'stage_change',
                description: `Moved from stage ${oldStage} to stage ${newStageId}`
            })

            toast.success('Stage updated')
        } catch (error: any) {
            toast.error('Failed to update stage')
            // Revert optimistic update
            updateClientStage(clientId, oldStage)
        }
    }

    function handleDragStart({ active }: any) {
        const client = clients.find(c => c.id === active.id)
        if (client) setActiveClient(client)
    }

    // Filter clients
    const filteredClients = clients.filter(c => {
        const query = searchQuery.toLowerCase()
        if (searchQuery) {
            const nameMatch = c.name.toLowerCase().includes(query)
            const companyMatch = c.company?.toLowerCase()?.includes(query) || false
            if (!nameMatch && !companyMatch) return false
        }
        if (filterGroup && PIPELINE_STAGES.find(s => s.id === c.stage)?.statusGroup !== filterGroup) {
            return false
        }
        return true
    })

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
            <BoardFilters />

            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-background rounded-lg border shadow-sm">
                {isLoading ? (
                    <div className="flex h-full w-max">
                        {PIPELINE_STAGES.map((stage) => (
                            <div key={stage.id} className="flex h-full w-80 flex-col gap-3 p-3 border-r bg-muted/5">
                                <div className="flex items-center justify-between mb-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                <Skeleton className="h-32 w-full rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg" />
                                <Skeleton className="h-32 w-full rounded-lg opacity-50" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full w-max">
                            {PIPELINE_STAGES.map((stage) => (
                                <PipelineColumn
                                    key={stage.id}
                                    stage={stage}
                                    clients={filteredClients.filter(c => c.stage === stage.id)}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeClient ? <ClientCard client={activeClient} /> : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>
        </div>
    )
}
