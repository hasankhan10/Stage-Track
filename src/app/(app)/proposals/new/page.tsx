import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalBuilder } from '@/components/proposals/ProposalBuilder'

export const metadata = { title: 'Create Proposal | StageTrack' }

export default async function NewProposalPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

    return (
        <div className="h-full">
            <ProposalBuilder clients={clients || []} />
        </div>
    )
}
