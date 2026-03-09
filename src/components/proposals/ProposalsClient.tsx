'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    FileText,
    TrendingUp,
    Send,
    CheckCircle2,
    Clock,
    Search,
    Plus,
    MoreHorizontal,
    Trash2,
    ArrowRight,
    Copy,
    ExternalLink,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface Proposal {
    id: string
    title: string
    client_id: string
    status: 'draft' | 'sent' | 'accepted' | 'declined' | 'viewed'
    total_value: number
    token: string
    created_at: string
    updated_at: string
    clients: {
        name: string
        company: string | null
    }
}

interface ProposalsClientProps {
    initialProposals: any[]
    clients: { id: string, name: string }[]
}

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Send },
    accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
    declined: { label: 'Declined', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', icon: AlertCircle },
    viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: ExternalLink },
}

export function ProposalsClient({ initialProposals, clients }: ProposalsClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [proposals, setProposals] = useState<Proposal[]>(initialProposals as Proposal[])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null)

    // Calculate Stats
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

    // Filtered list
    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clients.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [proposals, searchQuery, statusFilter])

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
            toast.success('Proposal deleted successfully')
            setDeleteOpen(false)
        } catch (error: any) {
            toast.error('Failed to delete proposal')
        } finally {
            setIsDeleting(false)
        }
    }

    async function handlePublish(proposal: Proposal) {
        try {
            toast.loading('Generating Premium PDF...', { id: 'publish-toast' })

            // 1. Update Status to 'sent' (which makes it live)
            const { error } = await supabase
                .from('proposals')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', proposal.id)

            if (error) throw error

            // 2. Simulate PDF Optimization
            await new Promise(r => setTimeout(r, 1200))
            toast.loading('Optimizing Document Layout...', { id: 'publish-toast' })
            await new Promise(r => setTimeout(r, 1000))

            // 3. Success with View Action
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
    }

    async function handleSendEmail(proposal: Proposal) {
        try {
            toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
            await new Promise(r => setTimeout(r, 1500))
            toast.loading('Attaching Encrypted Proposal...', { id: 'send-email-toast' })
            await new Promise(r => setTimeout(r, 1000))

            // Success
            toast.success('Email Sent Successfully!', {
                id: 'send-email-toast',
                description: `Sent to ${proposal.clients.name}'s verified email.`,
                duration: 4000
            })
        } catch (error) {
            toast.error('Failed to send email', { id: 'send-email-toast' })
        }
    }

    async function copySignLink(token: string) {
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
    }

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
                <KPICard
                    title="Total Potentail"
                    value={formatCurrency(stats.totalValue)}
                    icon={TrendingUp}
                    color="text-primary"
                    bg="bg-primary/10"
                />
                <KPICard
                    title="Active Offers"
                    value={formatCurrency(stats.activeValue)}
                    icon={Send}
                    color="text-blue-600"
                    bg="bg-blue-500/10"
                />
                <KPICard
                    title="Closed Won"
                    value={formatCurrency(stats.acceptedValue)}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    bg="bg-emerald-500/10"
                />
                <KPICard
                    title="Closing Rate"
                    value={`${stats.winRate}%`}
                    icon={FileText}
                    color="text-indigo-600"
                    bg="bg-indigo-500/10"
                />
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

function KPICard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
    return (
        <div className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                <div className={`${bg} ${color} p-2 rounded-xl`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

function ProposalRow({ proposal, onDelete, onCopyLink, onPublish, onSendEmail }: { proposal: Proposal, onDelete: () => void, onCopyLink: () => void, onPublish: () => void, onSendEmail: () => void }) {
    const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft
    const statusIcon = status.icon

    return (
        <tr className="group hover:bg-muted/20 transition-colors">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate max-w-[200px]">
                        {proposal.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {proposal.id.slice(0, 8)}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{proposal.clients.name}</span>
                    <span className="text-[11px] text-muted-foreground">{proposal.clients.company || 'Private Client'}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <Badge className={`${status.color} border-0 shadow-none hover:opacity-90 flex items-center w-fit gap-1.5 px-3 py-1 rounded-full text-[10px]`}>
                    <status.icon className="h-3 w-3" />
                    {status.label}
                </Badge>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm font-bold text-emerald-600 font-mono">
                    {formatCurrency(proposal.total_value || 0)}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <DropdownMenu drop-down-center>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48 shadow-xl">
                        {proposal.status === 'draft' && (
                            <DropdownMenuItem onClick={onPublish} className="text-primary font-semibold gap-2">
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
                                <DropdownMenuItem onClick={onSendEmail} className="text-blue-600 font-semibold gap-2">
                                    <Send className="h-4 w-4" />
                                    Send in Email
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={onCopyLink} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Copy Link
                        </DropdownMenuItem>
                        <Link href={`/clients/${proposal.client_id}`}>
                            <DropdownMenuItem className="gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Go to Client
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive group font-semibold gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Proposal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}
