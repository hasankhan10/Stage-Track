import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Receipt, FilePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Invoices | StageTrack' }

export default async function InvoicesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
      *,
      clients ( name )
    `)
        .order('created_at', { ascending: false })

    const typedInvoices = invoices || []

    function getStatusBadge(status: string) {
        switch (status) {
            case 'Draft': return <Badge variant="secondary">Draft</Badge>
            case 'Sent': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Sent (Unpaid)</Badge>
            case 'Paid': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Paid</Badge>
            case 'Overdue': return <Badge variant="destructive">Overdue</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Invoices</h2>
                    <p className="text-muted-foreground">Manage billing, collect payments via Stripe.</p>
                </div>
                <Button asChild>
                    <Link href="/invoices/new">
                        <FilePlus className="mr-2 h-4 w-4" />
                        Create Invoice
                    </Link>
                </Button>
            </div>

            {typedInvoices.length === 0 ? (
                <EmptyState
                    icon={Receipt}
                    title="No invoices found"
                    description="Create your first invoice to get paid."
                    ctaLabel="Create Invoice"
                    ctaHref="/invoices/new"
                />
            ) : (
                <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {typedInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <Link href={`/invoices`} className="hover:underline text-primary">
                                                {inv.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {inv.clients?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(inv.status)}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {formatCurrency(inv.amount / 100)}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                                            {new Date(inv.due_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
