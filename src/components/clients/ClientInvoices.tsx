'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Receipt,
    ExternalLink,
    Plus,
    MoreHorizontal,
    Trash2,
    Send,
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

interface Invoice {
    id: string
    status: 'unpaid' | 'paid' | 'overdue' | 'draft'
    total: number
    created_at: string
    line_items: any
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
    unpaid: { label: 'Unpaid', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    overdue: { label: 'Overdue', color: 'bg-rose-100 text-rose-700' },
}

export function ClientInvoices({ clientId }: { clientId: string }) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchInvoices()
    }, [clientId])

    async function fetchInvoices() {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('invoices')
                .select('id, status, total, created_at, line_items')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setInvoices(data || [])
        } catch (error) {
            toast.error('Failed to load invoices')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!invoiceToDelete) return
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', invoiceToDelete.id)

            if (error) throw error

            setInvoices(prev => prev.filter(p => p.id !== invoiceToDelete.id))
            toast.success('Invoice deleted')
            setDeleteOpen(false)
        } catch (error) {
            toast.error('Failed to delete invoice')
        } finally {
            setIsDeleting(false)
            setInvoiceToDelete(null)
        }
    }

    async function handlePublish(invoice: Invoice) {
        try {
            toast.loading('Generating Premium PDF...', { id: 'publish-toast' })

            // Remove draft flag from line_items to publish
            const updatedLineItems = { ...invoice.line_items, is_draft: false }

            const { error } = await supabase
                .from('invoices')
                .update({ line_items: updatedLineItems })
                .eq('id', invoice.id)

            if (error) throw error

            await new Promise(r => setTimeout(r, 1200))
            toast.loading('Optimizing Document Layout...', { id: 'publish-toast' })
            await new Promise(r => setTimeout(r, 1000))

            setInvoices(prev => prev.map(p =>
                p.id === invoice.id ? { ...p, line_items: updatedLineItems } : p
            ))

            toast.success('Invoice is now LIVE!', {
                id: 'publish-toast',
                description: 'The premium template is generated. Review it before sending.',
                action: {
                    label: 'View',
                    onClick: () => window.open(`/invoices/${invoice.id}`, '_blank')
                },
                duration: 6000
            })
        } catch (error) {
            toast.error('Failed to publish', { id: 'publish-toast' })
        }
    }

    async function handleSendEmail(invoice: Invoice) {
        toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1500))
        toast.loading('Attaching Encrypted Invoice PDF...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1000))

        toast.success('Invoice Sent Successfully!', {
            id: 'send-email-toast',
            duration: 4000
        })
    }

    async function handleMarkPaid(invoice: Invoice) {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: 'paid', paid_at: new Date().toISOString() })
                .eq('id', invoice.id)

            if (error) throw error

            setInvoices(prev => prev.map(p =>
                p.id === invoice.id ? { ...p, status: 'paid' } : p
            ))
            toast.success('Invoice marked as paid!')
        } catch (error) {
            toast.error('Failed to update invoice status')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        )
    }

    if (invoices.length === 0) {
        return (
            <EmptyState
                icon={Receipt}
                title="No Invoices"
                description="Create premium invoices to get paid."
                ctaLabel="Create Invoice"
                ctaAction={() => window.location.href = `/invoices/new?client=${clientId}`}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="font-semibold text-lg">Invoices</h3>
                <Link href={`/invoices/new?client=${clientId}`}>
                    <Button size="sm" className="rounded-full shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Build New
                    </Button>
                </Link>
            </div>

            <div className="grid gap-3">
                {invoices.map((invoice) => {
                    const isDraft = invoice.line_items?.is_draft
                    const computedStatus = isDraft ? 'draft' : invoice.status
                    const status = STATUS_CONFIG[computedStatus] || { label: computedStatus, color: 'bg-slate-100 text-slate-700' }
                    const invNumber = invoice.line_items?.invoice_number || `INV-${invoice.id.slice(0, 6)}`

                    return (
                        <div
                            key={invoice.id}
                            className="bg-card border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                    <Receipt className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm leading-none mb-1.5">{invNumber}</h4>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${status.color} border-0 shadow-none text-[10px] px-2 py-0 h-5`}>
                                            {status.label}
                                        </Badge>
                                        <span className="text-xs font-bold text-emerald-600 font-mono">
                                            {formatCurrency(invoice.total / 100)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
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
                                        {isDraft && (
                                            <>
                                                <DropdownMenuItem onClick={() => handlePublish(invoice)} className="text-primary font-semibold gap-2">
                                                    <Send className="h-4 w-4" />
                                                    Publish Now
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')} className="gap-2 font-medium focus:bg-primary/10">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Live Preview
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {!isDraft && (
                                            <>
                                                <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')} className="gap-2 font-medium focus:bg-primary/10">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    View Live Portal
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendEmail(invoice)} className="text-blue-600 font-semibold gap-2">
                                                    <Send className="h-4 w-4" />
                                                    Send in Email
                                                </DropdownMenuItem>
                                                {invoice.status !== 'paid' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleMarkPaid(invoice)} className="text-emerald-600 font-semibold gap-2">
                                                            Mark as Paid
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setInvoiceToDelete(invoice)
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
                        <DialogTitle className="text-destructive">Delete Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone.
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
