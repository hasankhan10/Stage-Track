import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Printer, Download, CheckCircle2, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PrintInvoiceButton } from '@/components/invoices/PrintInvoiceButton'

export const metadata = { title: 'Invoice Details | Stova Media' }

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
            *,
            clients (
                name,
                company,
                email,
                phone,
                website
            )
        `)
        .eq('id', id)
        .single()

    if (error || !invoice) {
        console.error("Invoice Preview Data Error:", error)
        return redirect('/invoices')
    }

    const lineItemsData = invoice.line_items as any
    const items = lineItemsData?.items || lineItemsData || []
    const notes = lineItemsData?.notes || ''
    const upiId = lineItemsData?.upi_id || ''
    const bankDetails = lineItemsData?.bank_details || ''

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Link href={`/clients/${invoice.client_id}?tab=invoices`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoice_number}</h1>
                        <p className="text-sm text-muted-foreground">Premium Client Invoice</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <PrintInvoiceButton />
                </div>
            </div>

            {/* Premium Invoice Template */}
            <Card className="border-none shadow-2xl bg-white overflow-hidden text-slate-900 rounded-3xl print:shadow-none print:p-0">
                {/* Decorative Top Accent */}
                <div className="h-4 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />

                <CardContent className="p-8 sm:p-14 space-y-12">

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div className="space-y-4">
                            {/* Logo/Brand */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Building2 className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{invoice.workspace?.name || 'Your Company'}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                            <h1 className="text-4xl font-black text-slate-200 tracking-tighter uppercase">Invoice</h1>
                            <p className="text-xl font-bold text-slate-800">{invoice.invoice_number}</p>
                            <div className="pt-2">
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-sm rounded-full px-4 py-1">
                                    {invoice.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-slate-100">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Billed To</p>
                            <p className="font-bold text-lg text-slate-900">{invoice.clients?.name}</p>
                            {invoice.clients?.company && <p className="text-slate-600">{invoice.clients?.company}</p>}
                            {invoice.clients?.email && <p className="text-slate-500 text-sm">{invoice.clients?.email}</p>}
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
                            <p className="font-semibold text-slate-900">{new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
                            <p className="font-semibold text-slate-900">{new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Due</p>
                            <p className="text-2xl font-black text-primary">{formatCurrency(invoice.total / 100)}</p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="space-y-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-sm w-1/2">Description</th>
                                    <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-sm text-center">Qty</th>
                                    <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-sm text-right">Price</th>
                                    <th className="py-4 font-bold text-slate-400 uppercase tracking-wider text-sm text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {Array.isArray(items) && items.map((item: any, i: number) => (
                                    <tr key={i} className="group">
                                        <td className="py-5 text-slate-800 font-medium">{item.description}</td>
                                        <td className="py-5 text-slate-600 text-center">{item.quantity}</td>
                                        <td className="py-5 text-slate-600 text-right">{formatCurrency(item.unit_price)}</td>
                                        <td className="py-5 text-slate-900 font-bold text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Payment Info Block */}
                    <div className="flex flex-col md:flex-row justify-between gap-10 pt-8 border-t border-slate-100">
                        {/* Payment Info */}
                        <div className="flex-1 space-y-6">
                            {(upiId || bankDetails) && (
                                <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" /> Payment Methods
                                    </h3>
                                    <div className="space-y-3">
                                        {upiId && (
                                            <div>
                                                <span className="text-slate-500 text-sm block">UPI ID</span>
                                                <span className="font-mono font-semibold text-slate-800">{upiId}</span>
                                            </div>
                                        )}
                                        {bankDetails && (
                                            <div>
                                                <span className="text-slate-500 text-sm block">Bank Details</span>
                                                <span className="font-mono text-sm whitespace-pre-wrap text-slate-700">{bankDetails}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {notes && (
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Notes</h3>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Totals Summary */}
                        <div className="w-full md:w-72 space-y-4 rounded-3xl p-6 bg-slate-50 border border-slate-100 h-fit">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium">{formatCurrency(invoice.subtotal / 100)}</span>
                            </div>
                            {invoice.tax > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Tax</span>
                                    <span className="font-medium">{formatCurrency(invoice.tax / 100)}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-900 uppercase tracking-wider">Total</span>
                                    <span className="text-3xl font-black text-primary">{formatCurrency(invoice.total / 100)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-12 text-center text-slate-400 text-sm font-medium">
                        Thank you for your business.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
