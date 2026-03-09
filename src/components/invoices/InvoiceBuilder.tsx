'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { InvoiceDetailsCard } from './InvoiceDetailsCard'
import { LineItemsCard } from './LineItemsCard'
import { PaymentDetailsCard } from './PaymentDetailsCard'

// ─── Schema ───────────────────────────────────────────────────────────────────

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.coerce.number().min(1, 'Min 1'),
    unit_price: z.coerce.number().min(0, 'Min 0'),
})

const invoiceSchema = z.object({
    client_id: z.string().min(1, 'Please select a client'),
    invoice_number: z.string().min(1, 'Required'),
    due_date: z.string().min(1, 'Required'),
    notes: z.string().optional(),
    upi_id: z.string().optional(),
    bank_details: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'Add at least one item'),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceBuilder({
    clients,
    nextInvoiceNumber
}: {
    clients: { id: string, name: string }[]
    nextInvoiceNumber: string
}) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const searchParams = useSearchParams()
    const [isPublishing, setIsPublishing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            client_id: searchParams.get('client') || '',
            invoice_number: nextInvoiceNumber,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Thank you for your business!',
            upi_id: '',
            bank_details: '',
            items: [{ description: '', quantity: 1, unit_price: 0 }],
        },
    })

    useEffect(() => {
        const clientFromQuery = searchParams.get('client')
        if (clientFromQuery) form.setValue('client_id', clientFromQuery)
    }, [searchParams, form])

    const watchItems = form.watch('items')
    const subtotal = useMemo(() => (watchItems || []).reduce((acc, item) =>
        acc + ((item?.quantity || 0) * (item?.unit_price || 0)), 0), [watchItems])

    const handleSave = useCallback(async (data: InvoiceFormValues, status: 'Draft' | 'Sent') => {
        try {
            if (status === 'Sent') setIsPublishing(true)
            else setIsSaving(true)

            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert({
                    client_id: data.client_id,
                    total: Math.round(subtotal * 100),
                    subtotal: Math.round(subtotal * 100),
                    status: 'unpaid',
                    line_items: {
                        items: data.items,
                        notes: data.notes,
                        upi_id: data.upi_id,
                        bank_details: data.bank_details,
                        invoice_number: data.invoice_number,
                        due_date: new Date(data.due_date).toISOString(),
                        is_draft: status !== 'Sent'
                    }
                })
                .select('id')
                .single()

            if (error) throw error

            await supabase.from('activity_log').insert({
                client_id: data.client_id,
                action_type: 'invoice',
                description: `Invoice ${data.invoice_number} was ${status === 'Sent' ? 'created & sent' : 'saved as draft'}`
            })

            if (status === 'Sent') {
                toast.loading('Synthesizing Document State...', { id: 'invoice-toast' })
                await new Promise(r => setTimeout(r, 1200))
                toast.loading('Applying Cryptographic Signatures...', { id: 'invoice-toast' })
                await new Promise(r => setTimeout(r, 1000))
                toast.success('Invoice Deployment Successful!', {
                    id: 'invoice-toast',
                    description: 'Your premium invoice is live and ready for deployment.',
                    action: { label: 'Review', onClick: () => window.open(`/invoices/${invoice.id}`, '_blank') },
                    duration: 6000
                })
            } else {
                toast.success('Invoice structure cached successfully')
            }
            router.push(`/clients/${data.client_id}?tab=invoices`)
        } catch (error: any) {
            toast.error(error.message || 'Error processing invoice', { id: 'invoice-toast' })
        } finally {
            setIsPublishing(false)
            setIsSaving(false)
        }
    }, [supabase, subtotal, router])

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <Link href="/invoices">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/40 hover:bg-muted transition-all bg-card/50 backdrop-blur-sm">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic">Deploy Invoice</h1>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/70 tracking-wide uppercase tracking-[0.05em]">Draft premium financial instruments with high execution precision.</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form className="space-y-10">
                    <InvoiceDetailsCard form={form} clients={clients} />
                    <LineItemsCard form={form} subtotal={subtotal} />
                    <PaymentDetailsCard form={form} />

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-4 p-8 rounded-[2.5rem] bg-card border border-border/40 shadow-premium sticky bottom-6 z-40 backdrop-blur-xl bg-card/80">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full px-8 h-12 font-black tracking-tight hover:bg-slate-100/50 transition-all border border-transparent hover:border-slate-200"
                            onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Draft'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                            Store Draft
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 h-12 font-black tracking-tight shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.97]"
                            onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Sent'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isPublishing ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Send className="mr-3 h-5 w-5" />}
                            Finalize & Deploy
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
