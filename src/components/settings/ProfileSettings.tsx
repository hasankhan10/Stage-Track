'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Switch } from '@/components/ui/switch'

export function ProfileSettings() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true
    })
    const supabase = createClient()

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setUser({ ...user, ...profile })
            }
            setLoading(false)
        }
        fetchUser()
    }, [])

    async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string

        try {
            const { error } = await supabase
                .from('users')
                .update({ name })
                .eq('id', user.id)

            if (error) throw error
            toast.success('Profile updated')
            setUser({ ...user, name })
        } catch (error: any) {
            toast.error('Failed to update profile: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />

    const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle>Personal Profile</CardTitle>
                <CardDescription>Update your personal information and how others see you.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.avatar_url} />
                            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" type="button">Change Avatar</Button>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={user?.email} disabled />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" defaultValue={user?.name} required />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium">Notification Preferences</h3>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive updates about your deals via email.</p>
                            </div>
                            <Switch
                                checked={preferences.emailNotifications}
                                onCheckedChange={(val: boolean) => setPreferences(prev => ({ ...prev, emailNotifications: val }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>In-app Notifications</Label>
                                <p className="text-xs text-muted-foreground">See notifications in the app bell icon.</p>
                            </div>
                            <Switch
                                checked={preferences.pushNotifications}
                                onCheckedChange={(val: boolean) => setPreferences(prev => ({ ...prev, pushNotifications: val }))}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
