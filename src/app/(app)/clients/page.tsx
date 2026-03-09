import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { ClientsListClient } from '@/components/clients/ClientsListClient'

export const metadata = {
    title: 'Clients | Stova Media',
    description: 'Full client directory — search, filter, and manage all your clients.',
}

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Scope to this user's workspace
    const { data: profile } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, company, email, phone, website, stage, deal_value, pipeline_status, stage_notes, updated_at, created_at')
        .eq('workspace_id', profile?.workspace_id)
        .order('updated_at', { ascending: false })

    // Total pipeline value
    const totalValue = clients?.reduce((s, c) => s + (c.deal_value || 0), 0) ?? 0
    const totalClients = clients?.length ?? 0
    const activeClients = clients?.filter(c => c.stage >= 6 && c.stage <= 11).length ?? 0

    return (
        <ClientsListClient
            clients={clients ?? []}
            stages={PIPELINE_STAGES}
            stats={{ totalValue, totalClients, activeClients }}
        />
    )
}
