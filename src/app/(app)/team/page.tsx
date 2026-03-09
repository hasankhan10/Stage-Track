import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TeamManagement } from "@/components/settings/TeamManagement"
import { Shield } from "lucide-react"

export default async function TeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return redirect('/')
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your agency team members and their access levels.
                </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-6">
                <TeamManagement />
            </div>
        </div>
    )
}
