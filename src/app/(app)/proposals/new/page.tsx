import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalBuilder } from '@/components/proposals/ProposalBuilder'

export const metadata = { title: 'Create Proposal | Stova Media' }

export default async function NewProposalPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', user.id)
        .single()

    if (!profile) return redirect('/login')

    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('workspace_id', profile.workspace_id)
        .order('name')

    return (
        <div className="h-full">
            <ProposalBuilder clients={clients || []} />
        </div>
    )
}
