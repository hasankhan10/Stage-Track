import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'

// Initialize Stripe (requires secret key in env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Verify Authentication & Permissions
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 2. Fetch Invoice & Client Info
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*, clients (name, email)')
            .eq('id', id)
            .single()

        if (invoiceError || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        if (!invoice.clients?.email) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })

        let paymentUrl = invoice.stripe_payment_url

        // 3. Generate Stripe Payment Link if it doesn't exist
        if (!paymentUrl && process.env.STRIPE_SECRET_KEY) {
            // Create a Product
            const product = await stripe.products.create({
                name: `Invoice ${invoice.invoice_number}`,
                description: `Consulting services for ${invoice.clients.name}`,
            })

            // Create a Price (amount is in cents)
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: invoice.amount,
                currency: 'usd',
            })

            // Create Payment Link
            const paymentLink = await stripe.paymentLinks.create({
                line_items: [{ price: price.id, quantity: 1 }],
                metadata: {
                    invoice_id: invoice.id,
                    client_id: invoice.client_id,
                },
                after_completion: {
                    type: 'redirect',
                    redirect: { url: `${APP_URL}/clients/${invoice.client_id}?success=true` },
                }
            })

            paymentUrl = paymentLink.url

            // Save URL to DB
            await supabase
                .from('invoices')
                .update({ stripe_payment_url: paymentUrl, status: 'Sent' })
                .eq('id', invoice.id)
        } else if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY is missing. Skipping real Stripe link generation.')
            paymentUrl = 'https://buy.stripe.com/test_dummy_link'
        }

        // 4. Send Email via Resend
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'billing@stovamedia.com',
                to: invoice.clients.email,
                subject: `Invoice ${invoice.invoice_number} from Your Brand`,
                html: `
          <h1>Hello ${invoice.clients.name},</h1>
          <p>Your invoice <strong>${invoice.invoice_number}</strong> is ready.</p>
          <p>Amount Due: $${(invoice.amount / 100).toFixed(2)}</p>
          <p><a href="${paymentUrl}" style="display:inline-block;padding:12px 24px;background-color:#000;color:#fff;text-decoration:none;border-radius:6px;">Pay Now via Stripe</a></p>
        `
            })
        }

        return NextResponse.json({ success: true, url: paymentUrl })

    } catch (error: any) {
        console.error('Stripe send error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
