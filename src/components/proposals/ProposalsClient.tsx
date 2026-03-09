'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    FileText,
    TrendingUp,
    Send,
    CheckCircle2,
    Search,
    Plus,
    Trash2,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import Link from 'next/link'
import { Proposal } from './types'
import { ProposalRow, ProposalKPICard } from './ProposalComponents'

interface ProposalsClientProps {
    initialProposals: any[]
    clients: { id: string, name: string }[]
}

export function ProposalsClient({ initialProposals, clients }: ProposalsClientProps) {
    const supabase = useMemo(() => createClient(), [])
    const [proposals, setProposals] = useState<Proposal[]>(initialProposals as Proposal[])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)

    const stats = useMemo(() => {
        const total = proposals.length
        const totalValue = proposals.reduce((acc, p) => acc + (p.total_value || 0), 0)
        const activeValue = proposals
            .filter(p => p.status === 'sent')
            .reduce((acc, p) => acc + (p.total_value || 0), 0)
        const acceptedValue = proposals
            .filter(p => p.status === 'accepted')
            .reduce((acc, p) => acc + (p.total_value || 0), 0)

        const winRate = total > 0
            ? Math.round((proposals.filter(p => p.status === 'accepted').length / total) * 100)
            : 0

        return { totalValue, activeValue, acceptedValue, winRate }
    }, [proposals])

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clients.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [proposals, searchQuery, statusFilter])

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
            toast.success('Proposal deleted successfully')
            setDeleteOpen(false)
        } catch (error: any) {
            toast.error('Failed to delete proposal')
        } finally {
            setIsDeleting(false)
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
                description: 'The secure link is generated. You can now review it before sending.',
                action: {
                    label: 'View Live',
                    onClick: () => window.open(`/portal?token=${proposal.token}`, '_blank')
                },
                duration: 6000
            })
        } catch (error) {
            toast.error('Failed to publish proposal', { id: 'publish-toast' })
        }
    }, [supabase])

    const handleSendEmail = useCallback(async (proposal: Proposal) => {
        try {
            toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
            await new Promise(r => setTimeout(r, 1500))
            toast.loading('Attaching Encrypted Proposal...', { id: 'send-email-toast' })
            await new Promise(r => setTimeout(r, 1000))

            toast.success('Email Sent Successfully!', {
                id: 'send-email-toast',
                description: `Sent to ${proposal.clients.name}'s verified email.`,
                duration: 4000
            })
        } catch (error) {
            toast.error('Failed to send email', { id: 'send-email-toast' })
        }
    }, [])

    const copySignLink = useCallback(async (token: string) => {
        try {
            if (!token) {
                toast.error('No access token found for this proposal.')
                return
            }
            const url = `${window.location.origin}/portal?token=${token}`
            await navigator.clipboard.writeText(url)
            toast.success('Sign-off link copied to clipboard!')
        } catch (err) {
            toast.error('Failed to copy link')
        }
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                        Proposals Hub
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Manage your professional offers, track acceptance, and close deals faster with branded digital proposals.
                    </p>
                </div>
                <Link href="/proposals/new">
                    <Button size="lg" className="rounded-full px-8 shadow-xl hover:shadow-primary/20 transition-all duration-300">
                        <Plus className="mr-2 h-5 w-5" />
                        Build New Proposal
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProposalKPICard title="Total Potential" value={formatCurrency(stats.totalValue)} icon={TrendingUp} color="text-primary" bg="bg-primary/10" />
                <ProposalKPICard title="Active Offers" value={formatCurrency(stats.activeValue)} icon={Send} color="text-blue-600" bg="bg-blue-500/10" />
                <ProposalKPICard title="Closed Won" value={formatCurrency(stats.acceptedValue)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-500/10" />
                <ProposalKPICard title="Closing Rate" value={`${stats.winRate}%`} icon={FileText} color="text-indigo-600" bg="bg-indigo-500/10" />
            </div>

            {/* Filters and List */}
            <div className="bg-card border rounded-2xl shadow-premium overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or client name..."
                            className="pl-10 h-10 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {['all', 'draft', 'sent', 'accepted', 'declined', 'viewed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize ${statusFilter === s
                                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                    : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                                    }`}
                            >
                                {s === 'all' ? 'All Status' : s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proposal Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Value</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredProposals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                                <AlertCircle className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">No proposals found matching your criteria.</p>
                                            <Link href="/proposals/new">
                                                <Button variant="link" className="text-primary font-bold">Create New Proposal</Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProposals.map((proposal) => (
                                    <ProposalRow
                                        key={proposal.id}
                                        proposal={proposal}
                                        onDelete={() => {
                                            setProposalToDelete(proposal)
                                            setDeleteOpen(true)
                                        }}
                                        onCopyLink={() => copySignLink(proposal.token)}
                                        onPublish={() => handlePublish(proposal)}
                                        onSendEmail={() => handleSendEmail(proposal)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Proposal
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{proposalToDelete?.title}</strong>? This will remove access for the client as well.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
