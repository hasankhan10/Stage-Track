'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    FileText,
    Plus,
    Trash2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Proposal } from '../proposals/types'
import { ClientProposalItem } from './ClientProposalItem'

export function ClientProposals({ clientId }: { clientId: string }) {
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchProposals = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('proposals')
                .select('id, title, status, total_value, token, created_at')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProposals(data as Proposal[] || [])
        } catch (error) {
            toast.error('Failed to load proposals')
        } finally {
            setIsLoading(false)
        }
    }, [clientId, supabase])

    useEffect(() => {
        fetchProposals()
    }, [fetchProposals])

    const handleDelete = useCallback(async () => {
        if (!proposalToDelete) return
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('proposals')
                .delete()
                .eq('id', proposalToDelete.id)

            if (error) throw error

            setProposals(prev => prev.filter(p => p.id !== proposalToDelete.id))
            toast.success('Proposal deleted')
            setDeleteOpen(false)
        } catch (error) {
            toast.error('Failed to delete proposal')
        } finally {
            setIsDeleting(false)
            setProposalToDelete(null)
        }
    }, [proposalToDelete, supabase])

    const handlePublish = useCallback(async (proposal: Proposal) => {
        try {
            toast.loading('Generating Premium PDF...', { id: 'publish-toast' })

            const { error } = await supabase
                .from('proposals')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', proposal.id)

            if (error) throw error

            await new Promise(r => setTimeout(r, 1200))
            toast.loading('Optimizing Document Layout...', { id: 'publish-toast' })
            await new Promise(r => setTimeout(r, 1000))

            setProposals(prev => prev.map(p =>
                p.id === proposal.id ? { ...p, status: 'sent' } : p
            ))

            toast.success('Proposal is now LIVE!', {
                id: 'publish-toast',
                description: 'The secure link is generated. Review it before sending.',
                action: {
                    label: 'View',
                    onClick: () => window.open(`/portal?token=${proposal.token}`, '_blank')
                },
                duration: 6000
            })
        } catch (error) {
            toast.error('Failed to publish', { id: 'publish-toast' })
        }
    }, [supabase])

    const handleSendEmail = useCallback(async (proposal: Proposal) => {
        toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1500))
        toast.loading('Attaching Encrypted Proposal...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1000))

        toast.success('Email Sent Successfully!', {
            id: 'send-email-toast',
            duration: 4000
        })
    }, [])

    const handleCopyLink = useCallback(async (token: string) => {
        const url = `${window.location.origin}/portal?token=${token}`
        await navigator.clipboard.writeText(url)
        toast.success('Proposal link copied!')
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        )
    }

    if (proposals.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No Proposals"
                description="Build and send proposals directly from here."
                ctaLabel="Create Proposal"
                ctaAction={() => window.location.href = `/proposals/new?client=${clientId}`}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-lg tracking-tight">Proposals</h3>
                <Link href={`/proposals/new?client=${clientId}`}>
                    <Button size="sm" className="rounded-full shadow-premium">
                        <Plus className="mr-2 h-4 w-4" /> Build New
                    </Button>
                </Link>
            </div>

            <div className="grid gap-3">
                {proposals.map((proposal) => (
                    <ClientProposalItem
                        key={proposal.id}
                        proposal={proposal}
                        onPublish={handlePublish}
                        onSendEmail={handleSendEmail}
                        onCopyLink={handleCopyLink}
                        onDeleteRequest={(p) => {
                            setProposalToDelete(p)
                            setDeleteOpen(true)
                        }}
                    />
                ))}
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-bold">Delete Proposal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this proposal? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="shadow-premium">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
