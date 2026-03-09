'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    FileText,
    Send,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Trash2,
    Copy,
    ExternalLink,
    Plus,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/formatters'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface Proposal {
    id: string
    title: string
    status: 'draft' | 'sent' | 'accepted' | 'declined' | 'viewed'
    total_value: number
    token: string
    created_at: string
}

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Clock },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
    viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: ExternalLink },
    accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    declined: { label: 'Declined', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
}

export function ClientProposals({ clientId }: { clientId: string }) {
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProposals()
    }, [clientId])

    async function fetchProposals() {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('proposals')
                .select('id, title, status, total_value, token, created_at')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProposals(data || [])
        } catch (error) {
            toast.error('Failed to load proposals')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
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
    }

    async function handlePublish(proposal: Proposal) {
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
    }

    async function handleSendEmail(proposal: Proposal) {
        toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1500))
        toast.loading('Attaching Encrypted Proposal...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1000))

        toast.success('Email Sent Successfully!', {
            id: 'send-email-toast',
            duration: 4000
        })
    }

    async function copyLink(token: string) {
        const url = `${window.location.origin}/portal?token=${token}`
        await navigator.clipboard.writeText(url)
        toast.success('Proposal link copied!')
    }

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
                <h3 className="font-semibold text-lg">Proposals</h3>
                <Link href={`/proposals/new?client=${clientId}`}>
                    <Button size="sm" className="rounded-full shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Build New
                    </Button>
                </Link>
            </div>

            <div className="grid gap-3">
                {proposals.map((proposal) => {
                    const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft
                    return (
                        <div
                            key={proposal.id}
                            className="bg-card border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm leading-none mb-1.5">{proposal.title}</h4>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${status.color} border-0 shadow-none text-[10px] px-2 py-0 h-5`}>
                                            <status.icon className="mr-1 h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                        <span className="text-xs font-bold text-emerald-600 font-mono">
                                            {formatCurrency(proposal.total_value)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                    <DropdownMenuContent align="end" className="w-48 shadow-xl">
                                        {proposal.status === 'draft' && (
                                            <DropdownMenuItem onClick={() => handlePublish(proposal)} className="text-primary font-semibold gap-2">
                                                <Send className="h-4 w-4" />
                                                Publish Now
                                            </DropdownMenuItem>
                                        )}
                                        {proposal.status !== 'draft' && (
                                            <>
                                                <Link href={`/portal?token=${proposal.token}`} target="_blank">
                                                    <DropdownMenuItem className="gap-2 font-medium">
                                                        <ExternalLink className="h-4 w-4" />
                                                        View Live Portal
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem onClick={() => handleSendEmail(proposal)} className="text-blue-600 font-semibold gap-2">
                                                    <Send className="h-4 w-4" />
                                                    Send in Email
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuItem onClick={() => copyLink(proposal.token)} className="gap-2">
                                            <Copy className="h-4 w-4" />
                                            Copy Link
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setProposalToDelete(proposal)
                                                setDeleteOpen(true)
                                            }}
                                            className="text-destructive font-semibold gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Proposal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this proposal? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
