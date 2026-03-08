import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!endpointSecret) throw new Error('Stripe Webhook Secret is missing')
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session
            const invoiceId = session.metadata?.invoice_id

            if (invoiceId) {
                // Update Invoice status to Paid
                await supabase
                    .from('invoices')
                    .update({
                        status: 'Paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', invoiceId)

                // Log Activity
                const { data: invoice } = await supabase
                    .from('invoices')
                    .select('client_id, invoice_number')
                    .eq('id', invoiceId)
                    .single()

                if (invoice) {
                    await supabase.from('activity_log').insert({
                        client_id: invoice.client_id,
                        action_type: 'invoice',
                        description: `Payment received for Invoice ${invoice.invoice_number}`
                    })

                    // Create Notification for the account owner or assigned user
                    // In this case, we'll notify the person who the client is assigned to
                    const { data: client } = await supabase
                        .from('clients')
                        .select('assigned_to')
                        .eq('id', invoice.client_id)
                        .single()

                    if (client?.assigned_to) {
                        await supabase.from('notifications').insert({
                            user_id: client.assigned_to,
                            title: 'Invoice Paid',
                            message: `Invoice ${invoice.invoice_number} has been paid successfully.`,
                            type: 'invoice',
                            link: `/invoices`
                        })
                    }
                }
            }
            break

        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
