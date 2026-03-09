import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalsClient } from '@/components/proposals/ProposalsClient'

export const metadata = {
    title: 'Proposals | Your Brand',
    description: 'Manage and track your business proposals.',
}

export default async function ProposalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Get user's workspace
    const { data: profile } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Fetch proposals with client names
    // Workspace scoping is handled by RLS based on client_id
    const { data: proposals, error } = await supabase
        .from('proposals')
        .select(`
            *,
            clients (
                name,
                company
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching proposals:', error)
    }

    // Fetch clients for the creation dialog
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('workspace_id', profile.workspace_id)
        .order('name')

    return (
        <div className="container mx-auto py-8">
            <ProposalsClient
                initialProposals={proposals || []}
                clients={clients || []}
            />
        </div>
    )
}
