'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PIPELINE_STAGES, getStageById } from '@/lib/pipeline'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/formatters'
import { CalendarDays, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ClientHeader({ client }: { client: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [isUpdating, setIsUpdating] = useState(false)
    const [isSharing, setIsSharing] = useState(false)
    const [currentStage, setCurrentStage] = useState(client.stage)

    const stageDefs = getStageById(currentStage)
    const createdDate = new Date(client.created_at).toLocaleDateString()
    const assignedInitial = client.users?.name?.charAt(0) || '?'

    async function handleShareProgress() {
        setIsSharing(true)
        try {
            const response = await fetch(`/api/clients/${client.id}/share`, {
                method: 'POST',
            })
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Failed to generate link')

            await navigator.clipboard.writeText(data.url)
            toast.success('Link copied to clipboard', {
                description: 'An email has also been sent to the client (if configured).'
            })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSharing(false)
        }
    }

    async function handleStageChange(newStageStr: string) {
        const newStage = parseInt(newStageStr)
        if (newStage === currentStage) return

        setIsUpdating(true)
        const oldStage = currentStage
        setCurrentStage(newStage) // Optimistic update

        try {
            const { error } = await supabase
                .from('clients')
                .update({ stage: newStage })
                .eq('id', client.id)

            if (error) throw error

            await supabase.from('activity_log').insert({
                client_id: client.id,
                action_type: 'stage_change',
                description: `Stage updated from ${oldStage} to ${newStage}`
            })

            toast.success('Stage updated')
            router.refresh()
        } catch (error: any) {
            toast.error('Failed to update stage')
            setCurrentStage(oldStage) // Rollback
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 bg-primary/10 text-primary">
                        <AvatarFallback className="text-xl font-bold">
                            {client.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                        {client.company && (
                            <p className="text-muted-foreground font-medium">{client.company}</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{formatCurrency(client.deal_value)}</span>
                        Deal Value
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Added {createdDate}
                    </div>
                    {client.users && (
                        <div className="flex items-center gap-2">
                            Assigned to
                            <Badge variant="secondary" className="font-normal">
                                {client.users.name}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Select
                    value={currentStage.toString()}
                    onValueChange={handleStageChange}
                    disabled={isUpdating}
                >
                    <SelectTrigger
                        className="w-[220px] font-medium"
                        style={{ borderColor: stageDefs?.color }}
                    >
                        <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                    {s.name}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    onClick={handleShareProgress}
                    disabled={isSharing}
                >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {isSharing ? 'Sharing...' : 'Share Progress'}
                </Button>
            </div>
        </div>
    )
}
