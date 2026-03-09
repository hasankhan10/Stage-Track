'use client'

import { useState, useEffect } from 'react'
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
import { CalendarDays, Link as LinkIcon, IndianRupee, MoreVertical, Trash2, ArrowRight, Share2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertTriangle,
    Loader2
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EditClientDialog } from '@/components/clients/EditClientDialog'

export function ClientHeader({ client }: { client: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [isUpdating, setIsUpdating] = useState(false)
    const [isSharing, setIsSharing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [currentStage, setCurrentStage] = useState(client.stage)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const stageDefs = getStageById(currentStage)
    const createdDate = new Date(client.created_at).toLocaleDateString()

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

    async function handleStageChange(newStage: number) {
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
            setCurrentStage(oldStage) // Rollback
        } finally {
            setIsUpdating(false)
        }
    }

    async function handleDeleteClient() {
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
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-foreground">{formatCurrency(client.deal_value)}</span>
                        Deal Value
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Added <span>{mounted ? createdDate : '...'}</span>
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

            <div className="flex flex-wrap items-center gap-3">
                <EditClientDialog client={client} />

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Transfer to Stage
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-48">
                                {PIPELINE_STAGES.map((s) => (
                                    <DropdownMenuItem
                                        key={s.id}
                                        disabled={currentStage === s.id || isUpdating}
                                        onClick={() => handleStageChange(s.id)}
                                    >
                                        <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                        {s.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuItem onClick={handleShareProgress} disabled={isSharing}>
                            <Share2 className="mr-2 h-4 w-4" />
                            {isSharing ? 'Sharing...' : 'Share Progress'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive group font-semibold"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Client
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to permanently delete <strong>{client.name}</strong>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-2 text-right space-x-2">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteClient}
                                disabled={isDeleting}
                                className="gap-2"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete Permanently
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
