import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Receipt, FilePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cachedFetch, cacheTags } from '@/lib/cache'

export const metadata = { title: 'Invoices | Your Brand' }

export default async function InvoicesPage() {
    const supabase = await createClient()
    // Middleware calls getUser() on every request — cookie is already verified. Safe.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return redirect('/login')

    const invoices = await cachedFetch(
        cacheTags.invoices(session.user.id), session.access_token,
        async (db) => {
            const { data } = await db.from('invoices')
                .select('id, status, total, created_at, line_items, clients ( name )')
                .order('created_at', { ascending: false })
            return data ?? []
        },
        { revalidate: 60, tags: [cacheTags.invoices(session.user.id)] }
    )

    function getStatusBadge(statusStr: string, isDraft?: boolean) {
        if (isDraft) return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200">Draft</Badge>
        switch (statusStr) {
            case 'unpaid': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Sent (Unpaid)</Badge>
            case 'paid': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Paid</Badge>
            case 'overdue': return <Badge variant="destructive">Overdue</Badge>
            default: return <Badge variant="outline">{statusStr}</Badge>
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

            {invoices.length === 0 ? (
                <EmptyState icon={Receipt} title="No invoices found" description="Create your first invoice to get paid." ctaLabel="Create Invoice" ctaHref="/invoices/new" />
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
                                {invoices.map((inv) => {
                                    const lineItems = inv.line_items as any
                                    const invNumber = lineItems?.invoice_number || `INV-${inv.id.slice(0, 6)}`
                                    const dueDate = lineItems?.due_date || new Date().toISOString()
                                    return (
                                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                <Link href={`/invoices/${inv.id}`} className="hover:underline text-primary">{invNumber}</Link>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{(inv.clients as any)?.name}</td>
                                            <td className="px-6 py-4">{getStatusBadge(inv.status, lineItems?.is_draft)}</td>
                                            <td className="px-6 py-4 font-semibold text-foreground">{formatCurrency(inv.total / 100)}</td>
                                            <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">{new Date(dueDate).toLocaleDateString()}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
