import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ClientHeader } from '@/components/clients/ClientHeader'
import { ClientTabs } from '@/components/clients/ClientTabs'

export default async function ClientProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch client details
    const { data: client, error } = await supabase
        .from('clients')
        .select(`
      *,
      users (
        name, email
      )
    `)
        .eq('id', id)
        .single()

    if (error || !client) {
        // Return a 404 or redirect back to pipeline
        return redirect('/pipeline')
    }

    return (
        <div className="flex flex-col gap-6">
            <ClientHeader client={client} />
            <div className="bg-background rounded-lg border shadow-sm p-4 h-[calc(100vh-16rem)] overflow-y-auto">
                <ClientTabs client={client} />
            </div>
        </div>
    )
}
