'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/formatters'
import { CalendarDays, IndianRupee } from 'lucide-react'
import { EditClientDialog } from '@/components/clients/EditClientDialog'
import { HeaderActions } from './HeaderComponents'
import { DeleteClientDialog } from './ClientDialogs'

export function ClientHeader({ client }: { client: any }) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [isUpdating, setIsUpdating] = useState(false)
    const [isSharing, setIsSharing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [currentStage, setCurrentStage] = useState(client.stage)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const createdDate = useMemo(() => new Date(client.created_at).toLocaleDateString(), [client.created_at])

    const handleShareProgress = useCallback(async () => {
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
    }, [client.id])

    const handleStageChange = useCallback(async (newStage: number) => {
        if (newStage === currentStage) return

        setIsUpdating(true)
        const oldStage = currentStage
        setCurrentStage(newStage)

        try {
            const { error } = await supabase
                .from('clients')
                .update({ stage: newStage })
                .eq('id', client.id)

            if (error) throw error

            const stageObj = PIPELINE_STAGES.find(s => s.id === newStage)
            await supabase.from('activity_log').insert({
                client_id: client.id,
                action_type: 'stage_change',
                description: `Stage updated to ${stageObj?.name || newStage}`
            })

            toast.success('Stage updated')
            router.refresh()
        } catch (error: any) {
            toast.error('Failed to update stage')
            setCurrentStage(oldStage)
        } finally {
            setIsUpdating(false)
        }
    }, [client.id, currentStage, supabase, router])

    const handleDeleteClient = useCallback(async () => {
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id)

            if (error) throw error

            toast.success('Client deleted')
            router.push('/clients')
        } catch (error: any) {
            toast.error('Failed to delete client')
            setIsDeleting(false)
        }
    }, [client.id, supabase, router])

    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 bg-primary/10 text-primary border-2 border-primary/5 transition-transform hover:scale-105">
                        <AvatarFallback className="text-2xl font-black">
                            {client.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{client.name}</h1>
                        {client.company && (
                            <p className="text-muted-foreground font-bold flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                {client.company}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-foreground">{formatCurrency(client.deal_value)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Deal Value</span>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                        <CalendarDays className="h-4 w-4 text-muted-foreground/70" />
                        <span className="font-medium">Added <span className="text-foreground" suppressHydrationWarning>{mounted ? createdDate : '...'}</span></span>
                    </div>
                    {client.users && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ownership</span>
                            <Badge variant="secondary" className="font-bold bg-primary/5 hover:bg-primary/10 text-primary border-primary/10 transition-colors">
                                {client.users.name}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            <HeaderActions
                currentStage={currentStage}
                isUpdating={isUpdating}
                isSharing={isSharing}
                onStageChange={handleStageChange}
                onShare={handleShareProgress}
                onDeleteRequest={() => setDeleteOpen(true)}
                editComponent={<EditClientDialog client={client} />}
            />

            <DeleteClientDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                client={client}
                onDelete={handleDeleteClient}
                deleting={isDeleting}
            />
        </div>
    )
}
