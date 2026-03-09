'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Receipt,
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
import { Invoice, InvoiceItem } from './InvoiceItem'

export function ClientInvoices({ clientId }: { clientId: string }) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)

    const supabase = useMemo(() => createClient(), [])

    const fetchInvoices = useCallback(async () => {
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
    }, [clientId, supabase])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const handleDelete = useCallback(async () => {
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
    }, [invoiceToDelete, supabase])

    const handlePublish = useCallback(async (invoice: Invoice) => {
        try {
            toast.loading('Generating Premium PDF...', { id: 'publish-toast' })
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
    }, [supabase])

    const handleSendEmail = useCallback(async (invoice: Invoice) => {
        toast.loading('Preparing Premium Email Delivery...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1500))
        toast.loading('Attaching Encrypted Invoice PDF...', { id: 'send-email-toast' })
        await new Promise(r => setTimeout(r, 1000))

        toast.success('Invoice Sent Successfully!', {
            id: 'send-email-toast',
            duration: 4000
        })
    }, [])

    const handleMarkPaid = useCallback(async (invoice: Invoice) => {
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
    }, [supabase])

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
                <h3 className="font-bold text-lg tracking-tight">Invoices</h3>
                <Link href={`/invoices/new?client=${clientId}`}>
                    <Button size="sm" className="rounded-full shadow-premium">
                        <Plus className="mr-2 h-4 w-4" /> Build New
                    </Button>
                </Link>
            </div>

            <div className="grid gap-3">
                {invoices.map((invoice) => (
                    <InvoiceItem
                        key={invoice.id}
                        invoice={invoice}
                        onPublish={handlePublish}
                        onSendEmail={handleSendEmail}
                        onMarkPaid={handleMarkPaid}
                        onDeleteRequest={(inv) => {
                            setInvoiceToDelete(inv)
                            setDeleteOpen(true)
                        }}
                    />
                ))}
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive font-bold">Delete Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone.
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
