'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Save, Send, Plus, Trash2 } from 'lucide-react'
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
    const [isPublishing, setIsPublishing] = useState(false)

    const form = useForm<InvoiceFormValues>({
        // @ts-ignore - resolving potential deep type mismatch in zod/rhf version
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            client_id: '',
            invoice_number: nextInvoiceNumber,
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days default
            notes: 'Thank you for your business!',
            items: [{ description: '', quantity: 1, unit_price: 0 }],
        },
    })

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
            setIsPublishing(true)

            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            // Insert Invoice
            const { data: invoice, error: insertError } = await supabase
                .from('invoices')
                .insert({
                    client_id: data.client_id,
                    workspace_id: profile.workspace_id,
                    invoice_number: data.invoice_number,
                    due_date: new Date(data.due_date).toISOString(),
                    amount: Math.round(subtotal * 100), // Convert to cents
                    status: status,
                    line_items: data.items, // Storing as JSONB for simplicity in MVP
                    created_by: userData.user.id,
                })
                .select('id')
                .single()

            if (insertError) throw insertError

            await supabase.from('activity_log').insert({
                client_id: data.client_id,
                action_type: 'invoice',
                description: `Invoice ${data.invoice_number} was ${status === 'Sent' ? 'created & sent' : 'saved as draft'}`
            })

            if (status === 'Sent') {
                // Trigger Server Action to generate Stripe Link & Email
                const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' })
                if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.error || 'Failed to send invoice via Stripe/Resend')
                }

                toast.success('Invoice Sent!', {
                    description: 'Payment link generated and emailed to client.'
                })
            } else {
                toast.success('Draft Saved')
            }

            router.push(`/clients/${data.client_id}?tab=invoices`)

        } catch (error: any) {
            toast.error(error.message || 'Error processing invoice')
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                        <p className="text-muted-foreground">Draft and send a new invoice to collect payment.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Draft'))}
                        disabled={form.formState.isSubmitting || isPublishing}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button
                        type="button"
                        onClick={form.handleSubmit((d) => handleSave(d as unknown as InvoiceFormValues, 'Sent'))}
                        disabled={form.formState.isSubmitting || isPublishing}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {isPublishing ? 'Processing...' : 'Send Invoice'}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form className="space-y-6">
                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg">Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="client_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Client</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select target client" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clients.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                                            <FormLabel>Invoice #</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="due_date"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Line Items</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md bg-muted/20 relative group">

                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-6">
                                                <FormField
                                                    control={form.control as any}
                                                    name={`items.${index}.description`}
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel className="md:hidden">Description</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Item Description" {...field} />
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
                                                                <Input type="number" min="1" {...field} />
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
                                                            <FormLabel className="md:hidden">Unit Price (USD)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" step="0.01" min="0" {...field} />
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

                            <div className="flex justify-end mt-8 border-t pt-6">
                                <div className="w-full md:w-1/3 space-y-3">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                                        <span>Total Due</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control as any}
                                name="notes"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Client Notes / Terms</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Additional notes for the client..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}
