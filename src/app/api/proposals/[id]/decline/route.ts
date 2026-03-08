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

    const { data: link } = await supabase
        .from('client_links')
        .select('client_id')
        .eq('token', token)
        .single()

    if (!link) return redirect('/404')

    const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('id', id)
        .eq('client_id', link.client_id)
        .single()

    if (!proposal) return redirect('/404')

    // Update Status
    await supabase
        .from('proposals')
        .update({ status: 'Declined', updated_at: new Date().toISOString() })
        .eq('id', id)

    // Log Activity
    await supabase.from('activity_log').insert({
        client_id: link.client_id,
        action_type: 'proposal',
        description: `Proposal declined by client.`
    })

    return redirect(`/proposals/${token}`)
}
