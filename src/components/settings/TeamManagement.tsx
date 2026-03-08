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
import { Loader2, UserPlus, Mail, Shield } from 'lucide-react'

export function TeamManagement() {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchMembers()
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
        setInviting(true)
        const formData = new FormData(e.currentTarget)
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

            toast.success(`User created: ${email}. Temp password: ${tempPassword}`, {
                duration: 10000, // Show longer so admin can copy password
            })
            e.currentTarget.reset()
            fetchMembers()
        } catch (error: any) {
            toast.error('Failed to create user: ' + error.message)
        } finally {
            setInviting(false)
        }
    }

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
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>A list of people who have access to this workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
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
                                        <Badge variant="secondary" className="gap-1">
                                            <Shield className="h-3 w-3" />
                                            Admin
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
