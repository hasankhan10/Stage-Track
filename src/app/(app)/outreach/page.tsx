import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OutreachClient } from '@/components/outreach/OutreachClient'
import { cachedFetch, cacheTags } from '@/lib/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLog = any

export const metadata = { title: 'Outreach | Your Brand' }

export default async function OutreachPage() {
    const supabase = await createClient()
    // Middleware calls getUser() on every request — cookie is already verified. Safe.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return redirect('/login')

    const token = session.access_token

    const profile = await cachedFetch(
        cacheTags.user(session.user.id), token,
        async (db) => {
            const { data } = await db.from('users').select('workspace_id, role').eq('id', session.user.id).single()
            return data
        },
        { revalidate: 300, tags: [cacheTags.user(session.user.id)] }
    )

    const isAdmin = profile?.role === 'admin'
    const workspaceId = profile?.workspace_id

    const [logs, clients] = await Promise.all([
        cachedFetch(
            cacheTags.outreach(workspaceId ?? ''), token,
            async (db) => {
                const { data } = await db.from('outreach_log')
                    .select('id, channel, status, notes, client_id, contacted_at:date, clients!inner ( id, name, company, workspace_id )')
                    .eq('clients.workspace_id', workspaceId)
                    .order('date', { ascending: false })
                return data ?? []
            },
            { revalidate: 60, tags: [cacheTags.outreach(workspaceId ?? '')] }
        ),
        cachedFetch(
            `outreach-clients-${workspaceId}`, token,
            async (db) => {
                const { data } = await db.from('clients').select('id, name').eq('workspace_id', workspaceId).order('name')
                return data ?? []
            },
            { revalidate: 120, tags: [cacheTags.clients(workspaceId ?? '')] }
        ),
    ])

    return <OutreachClient logs={logs as AnyLog[]} clients={clients} isAdmin={isAdmin} />
}
