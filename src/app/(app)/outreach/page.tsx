import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OutreachClient } from '@/components/outreach/OutreachClient'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLog = any

export const metadata = { title: 'Outreach | StageTrack' }

export default async function OutreachPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Get profile — needed for workspace scoping AND role check
    const { data: profile } = await supabase
        .from('users')
        .select('workspace_id, role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'
    const workspaceId = profile?.workspace_id

    // ✅ FIX: Workspace isolation via join (since outreach_log has no workspace_id column)
    // We select clients!inner to filter only logs where the client belongs to the workspace
    const [logsRes, clientsRes] = await Promise.all([
        supabase
            .from('outreach_log')
            .select(`
                id, channel, status, notes, client_id,
                contacted_at:date,
                clients!inner ( id, name, company, workspace_id )
            `)
            .eq('clients.workspace_id', workspaceId)
            .order('date', { ascending: false }),
        supabase
            .from('clients')
            .select('id, name')
            .eq('workspace_id', workspaceId)
            .order('name'),
    ])

    return (
        <OutreachClient
            logs={(logsRes.data ?? []) as AnyLog[]}
            clients={clientsRes.data ?? []}
            isAdmin={isAdmin}
        />
    )
}
