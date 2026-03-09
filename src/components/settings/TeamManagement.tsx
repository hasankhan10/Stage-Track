'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, UserPlus, Mail, Shield, Trash2 } from 'lucide-react'

export function TeamManagement() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchMembers()
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null)
        })
    }, [])

    async function fetchMembers() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setMembers(data || [])
        } catch (error: any) {
            console.error('Error fetching members:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const target = e.currentTarget
        setInviting(true)
        const formData = new FormData(target)
        const email = formData.get('email') as string
        const name = formData.get('name') as string

        try {
            // Generate a random temporary password
            const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password: tempPassword })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            toast.success(`Invitation sent to ${email}`, {
                description: 'They can now login using the credentials sent to their inbox.',
            })
            target.reset()
            fetchMembers()
        } catch (error: any) {
            toast.error('Failed to create user: ' + error.message)
        } finally {
            setInviting(false)
        }
    }

    async function handleRemove(id: string) {
        if (!confirm('Are you sure you want to completely remove this user? Their login access will be revoked permanently.')) return

        setRemovingId(id)
        try {
            const response = await fetch('/api/admin/remove-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            toast.success('Team member removed successfully')
            setMembers(prev => prev.filter(m => m.id !== id))
        } catch (error: any) {
            toast.error('Failed to remove user: ' + error.message)
        } finally {
            setRemovingId(null)
        }
    }

    const activeMembers = members.filter(m => m.last_login_at !== null)
    const pendingMembers = members.filter(m => m.last_login_at === null)

    if (loading) return <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Invite Team Member</CardTitle>
                    <CardDescription>Send an email invitation to join your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Input name="name" type="text" placeholder="Full Name" required />
                        </div>
                        <div className="flex-1 relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input name="email" type="email" placeholder="colleague@example.com" className="pl-9" required />
                        </div>
                        <Button type="submit" disabled={inviting}>
                            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Invite
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle>Active Team Members</CardTitle>
                    <CardDescription>People who have successfully joined the workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                        No active members found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activeMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {member.name?.split(' ').map((n: string) => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === 'admin' ? 'secondary' : 'outline'} className="gap-1 capitalize">
                                                {member.role === 'admin' ? <Shield className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.id !== currentUserId && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(member.id)}
                                                    disabled={removingId === member.id}
                                                >
                                                    {removingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {pendingMembers.length > 0 && (
                <Card className="border-none shadow-none bg-muted/20">
                    <CardHeader>
                        <CardTitle className="text-sm">Pending Invitations</CardTitle>
                        <CardDescription>These users have been invited but haven't logged in yet.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {pendingMembers.map((member) => (
                                    <TableRow key={member.id} className="border-none opacity-70">
                                        <TableCell className="w-[40%]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <span className="text-sm">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="text-[10px] uppercase">Pending</Badge>
                                        </TableCell>
                                        <TableCell className="text-right w-[80px]">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemove(member.id)}
                                                disabled={removingId === member.id}
                                            >
                                                {removingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
