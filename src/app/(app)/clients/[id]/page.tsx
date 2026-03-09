import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ClientHeader } from '@/components/clients/ClientHeader'
import { ClientTabs } from '@/components/clients/ClientTabs'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
        return redirect('/clients')
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Back navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                    href="/clients"
                    className="flex items-center gap-1 hover:text-foreground transition-colors font-medium group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    Clients
                </Link>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                <span className="text-foreground font-semibold truncate max-w-[260px]">
                    {client.name}
                </span>
            </div>

            <ClientHeader client={client} />
            <div className="bg-background rounded-lg border shadow-sm p-4 h-[calc(100vh-16rem)] overflow-y-auto">
                <ClientTabs client={client} />
            </div>
        </div>
    )
}
