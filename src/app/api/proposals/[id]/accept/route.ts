import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const formData = await request.formData()
    const token = formData.get('token') as string

    if (!token) return redirect('/404')

    // Verify the token matches a client link to prevent unauthorized accepts
    const { data: link } = await supabase
        .from('client_links')
        .select('client_id')
        .eq('token', token)
        .single()

    if (!link) return redirect('/404')

    // Double check the proposal belongs to this client
    const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('id', id)
        .eq('client_id', link.client_id)
        .single()

    if (!proposal) return redirect('/404')

    // Update Proposal Status
    await supabase
        .from('proposals')
        .update({ status: 'Accepted', updated_at: new Date().toISOString() })
        .eq('id', id)

    // Log Activity
    await supabase.from('activity_log').insert({
        client_id: link.client_id,
        action_type: 'proposal',
        description: `Proposal accepted by client.`
    })

    // (Optional) Automatically update the client's pipeline stage to "Contract Sent" or similar
    await supabase
        .from('clients')
        .update({ stage: 5 }) // 5 is 'Negotiation/Proposal' or 'Contract Sent' according to static list
        .eq('id', link.client_id)

    // Redirect back to the token page so they see the success banner
    return redirect(`/proposals/${token}`)
}
