import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder'

export const metadata = { title: 'Create Invoice | Stova Media' }

export default async function NewInvoicePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Fetch clients to populate dropdown
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

    // Generate a sequential invoice number (e.g. INV-1001)
    const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let nextNum = 'INV-1001'
    if (lastInvoice && lastInvoice.invoice_number.startsWith('INV-')) {
        const lastNum = parseInt(lastInvoice.invoice_number.replace('INV-', ''))
        if (!isNaN(lastNum)) {
            nextNum = `INV-${lastNum + 1}`
        }
    }

    return (
        <div className="h-full">
            <InvoiceBuilder
                clients={clients || []}
                nextInvoiceNumber={nextNum}
            />
        </div>
    )
}
