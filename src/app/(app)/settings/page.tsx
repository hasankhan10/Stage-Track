import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createClientBrowser } from '@/utils/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { User } from "lucide-react"

// Settings page renders user-specific data that changes frequently —
// no aggressive caching needed here, auth guard is sufficient.
export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal account preferences and profile information.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-0">
                    <ProfileSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
