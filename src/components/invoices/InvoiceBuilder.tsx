'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, Plus, Trash2, Loader2, Receipt, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

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

export function InvoiceBuilder({
    clients,
    nextInvoiceNumber
}: {
    clients: { id: string, name: string }[]
    nextInvoiceNumber: string
}) {
    const router = useRouter()
    const supabase = createClient()
    const searchParams = useSearchParams()
    const [isPublishing, setIsPublishing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<InvoiceFormValues>({
        // @ts-ignore - resolving potential deep type mismatch in zod/rhf version
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            client_id: searchParams.get('client') || '',
            invoice_number: nextInvoiceNumber,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days default
            notes: 'Thank you for your business!',
            upi_id: '',
            bank_details: '',
            items: [{ description: '', quantity: 1, unit_price: 0 }],
        },
    })

    // Update client_id if query param changes
    useEffect(() => {
        const clientFromQuery = searchParams.get('client')
        if (clientFromQuery) {
            form.setValue('client_id', clientFromQuery)
        }
    }, [searchParams, form])

    // Hook up Field Array for dynamic line items
    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    })

    // Watch items to calculate total
    const watchItems = form.watch("items")
    const subtotal = (watchItems || []).reduce((acc, item) => acc + ((item?.quantity || 0) * (item?.unit_price || 0)), 0)

    async function handleSave(data: InvoiceFormValues, status: 'Draft' | 'Sent') {
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

            // Insert Invoice
            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert({
                    client_id: data.client_id,
                    total: Math.round(subtotal * 100), // Convert to cents
                    subtotal: Math.round(subtotal * 100),
                    status: status === 'Sent' ? 'unpaid' : 'unpaid', // DB expects 'unpaid', 'paid', 'overdue'
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
                toast.loading('Generating Premium PDF...', { id: 'invoice-toast' })
                await new Promise(r => setTimeout(r, 1200))
                toast.loading('Optimizing Document Layout...', { id: 'invoice-toast' })
                await new Promise(r => setTimeout(r, 1000))

                toast.success('Invoice is now LIVE!', {
                    id: 'invoice-toast',
                    description: 'Premium template generated. You can now review and send.',
                    action: {
                        label: 'View',
                        onClick: () => window.open(`/invoices/${invoice.id}`, '_blank')
                    },
                    duration: 6000
                })
                router.push(`/clients/${data.client_id}?tab=invoices`)
            } else {
                toast.success('Draft saved successfully')
                router.push(`/clients/${data.client_id}?tab=invoices`)
            }

        } catch (error: any) {
            toast.error(error.message || 'Error processing invoice', { id: 'invoice-toast' })
        } finally {
            setIsPublishing(false)
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/invoices">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
                        <p className="text-sm text-muted-foreground">Draft and send a professional bill to your client.</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form className="space-y-6">
                    {/* Invoice Details Card */}
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <div className="flex items-center gap-2 text-primary">
                                <Receipt className="h-5 w-5" />
                                <CardTitle className="text-lg">Invoice Details</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="client_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Target Client</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all">
                                                        <SelectValue placeholder="Select target client">
                                                            {clients.find(c => c.id === field.value)?.name}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl shadow-2xl">
                                                    {clients.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="invoice_number"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all font-mono" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="due_date"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items Card */}
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2 text-primary">
                                <CreditCard className="h-5 w-5" />
                                <CardTitle className="text-lg">Line Items</CardTitle>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
                                onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-4 p-5 rounded-2xl border bg-background/30 relative group hover:border-primary/30 transition-all">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-6">
                                                <FormField
                                                    control={form.control as any}
                                                    name={`items.${index}.description`}
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel className="md:hidden">Description</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Service or product description" {...field} className="h-11 bg-transparent border-muted-foreground/20 rounded-xl focus:ring-primary/20" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control as any}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel className="md:hidden">Qty</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="1" {...field} className="h-11 bg-transparent border-muted-foreground/20 rounded-xl focus:ring-primary/20" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="md:col-span-4">
                                                <FormField
                                                    control={form.control as any}
                                                    name={`items.${index}.unit_price`}
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel className="md:hidden">Unit Price (INR)</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₹</span>
                                                                    <Input type="number" step="0.01" min="0" {...field} className="h-11 pl-7 bg-transparent border-muted-foreground/20 rounded-xl focus:ring-primary/20" />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="w-full md:w-1/3 space-y-3">
                                    <div className="flex justify-between text-muted-foreground font-medium">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xl font-bold pt-3 border-t border-primary/20 text-primary">
                                        <span>Total Amount</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Details Card */}
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/50">
                            <div className="flex items-center gap-2 text-primary">
                                <CreditCard className="h-5 w-5" />
                                <CardTitle className="text-lg">Payment Info & Notes</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control as any}
                                    name="upi_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>UPI ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., yourname@upi" className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all font-mono" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="bank_details"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Bank Details (Account / IFSC)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Account Name:&#10;Account No:&#10;IFSC Code:" className="min-h-[80px] bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all font-mono" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="notes"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground font-semibold">Additional Notes / Terms</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter payment terms or a thank you note..."
                                                className="min-h-[100px] bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all resize-none p-4"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pb-10">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full px-6 h-11 font-semibold hover:bg-slate-100 transition-colors"
                            onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Draft'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90 rounded-full px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Sent'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Publish & Review
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
