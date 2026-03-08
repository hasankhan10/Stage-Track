import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings"
import { TeamManagement } from "@/components/settings/TeamManagement"
import { User, Shield, Building2 } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal account, workspace configuration, and team members.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="workspace" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Workspace
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Team
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-0">
                    <ProfileSettings />
                </TabsContent>

                <TabsContent value="workspace" className="mt-0">
                    <WorkspaceSettings />
                </TabsContent>

                <TabsContent value="team" className="mt-0">
                    <TeamManagement />
                </TabsContent>
            </Tabs>
        </div>
    )
}
