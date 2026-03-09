import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { ClientsListClient } from '@/components/clients/ClientsListClient'
import { cachedFetch, cacheTags } from '@/lib/cache'

export const metadata = {
    title: 'Clients | Your Brand',
    description: 'Full client directory — search, filter, and manage all your clients.',
}

export default async function ClientsPage() {
    const supabase = await createClient()
    // Middleware already verified the JWT via getUser() — safe to use getSession() here
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return redirect('/login')

    const token = session.access_token
    const userId = session.user.id

    const profile = await cachedFetch(
        cacheTags.user(userId), token,
        async (db) => {
            const { data } = await db
                .from('users')
                .select('workspace_id')
                .eq('id', userId)
                .single()
            return data
        },
        { revalidate: 300, tags: [cacheTags.user(userId)] }
    )

    const clients = await cachedFetch(
        cacheTags.clients(profile?.workspace_id ?? ''), token,
        async (db) => {
            const { data } = await db
                .from('clients')
                .select('id, name, company, email, phone, website, stage, deal_value, pipeline_status, stage_notes, updated_at, created_at')
                .eq('workspace_id', profile?.workspace_id)
                .order('updated_at', { ascending: false })
            return data ?? []
        },
        { revalidate: 60, tags: [cacheTags.clients(profile?.workspace_id ?? '')] }
    )

    const totalValue = clients.reduce((s, c) => s + (c.deal_value || 0), 0)
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.stage >= 6 && c.stage <= 11).length

    return (
        <ClientsListClient
            clients={clients}
            stages={PIPELINE_STAGES}
            stats={{ totalValue, totalClients, activeClients }}
        />
    )
}
