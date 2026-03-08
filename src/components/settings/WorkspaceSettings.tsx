'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'

export function WorkspaceSettings() {
    const [workspace, setWorkspace] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchWorkspace() {
            // For now, fetch the first workspace the user belongs to
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: workspaces } = await supabase
                    .from('workspaces')
                    .select('*')
                    .limit(1)

                if (workspaces && workspaces.length > 0) {
                    setWorkspace(workspaces[0])
                }
            }
            setLoading(false)
        }
        fetchWorkspace()
    }, [])

    async function handleUpdateWorkspace(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string

        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ name })
                .eq('id', workspace.id)

            if (error) throw error
            toast.success('Workspace updated')
            setWorkspace({ ...workspace, name })
        } catch (error: any) {
            toast.error('Failed to update workspace: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />
    if (!workspace) return <div className="text-center py-12">No workspace found.</div>

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle>Workspace Configuration</CardTitle>
                <CardDescription>Manage your team workspace and branding.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-primary" />
                        </div>
                        <Button variant="outline" type="button">Change Logo</Button>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="ws-name">Workspace Name</Label>
                        <Input id="ws-name" name="name" defaultValue={workspace?.name} required />
                    </div>

                    <div className="grid gap-2">
                        <Label>Workspace Slug</Label>
                        <Input value={workspace?.id} disabled />
                        <p className="text-xs text-muted-foreground">This is your unique workspace ID.</p>
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Workspace
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
