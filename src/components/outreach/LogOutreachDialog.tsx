'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { MessageSquarePlus } from 'lucide-react'

const outreachSchema = z.object({
    client_id: z.string().min(1, 'Select a client to log outreach against'),
    channel: z.enum(['Email', 'LinkedIn', 'Call', 'Meeting', 'Other']),
    status: z.enum(['Sent', 'Replied', 'Bounced', 'Meeting Set', 'No Answer', 'Interested', 'Not Interested']),
    notes: z.string().optional(),
})

type OutreachFormValues = z.infer<typeof outreachSchema>

export function LogOutreachDialog({
    clients,
    defaultClientId,
    children
}: {
    clients: { id: string, name: string }[]
    defaultClientId?: string
    children?: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<OutreachFormValues>({
        resolver: zodResolver(outreachSchema),
        defaultValues: {
            client_id: defaultClientId || '',
            channel: 'Email',
            status: 'Sent',
            notes: '',
        },
    })

    async function onSubmit(data: OutreachFormValues) {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            const { error } = await supabase.from('outreach_log').insert({
                client_id: data.client_id,
                user_id: userData.user.id,
                workspace_id: profile.workspace_id,
                channel: data.channel,
                status: data.status,
                notes: data.notes || '',
            })

            if (error) throw error

            // Also log this in activity feed
            await supabase.from('activity_log').insert({
                client_id: data.client_id,
                action_type: 'outreach',
                description: `Logged ${data.channel} outreach (${data.status})`
            })

            toast.success('Outreach logged successfully')
            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to log outreach')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    (children as any) || (
                        <Button>
                            <MessageSquarePlus className="mr-2 h-4 w-4" />
                            Log Outreach
                        </Button>
                    )
                }
            />
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Outreach</DialogTitle>
                    <DialogDescription>
                        Record emails, calls, and DMs to keep track of your pipeline touchpoints.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client / Lead</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!defaultClientId}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Search connected clients..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="channel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Channel</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Email">Email</SelectItem>
                                                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                                <SelectItem value="Call">Call</SelectItem>
                                                <SelectItem value="Meeting">Meeting</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status / Outcome</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Sent">Sent / Left VM</SelectItem>
                                                <SelectItem value="Replied">Replied</SelectItem>
                                                <SelectItem value="Bounced">Bounced / Failed</SelectItem>
                                                <SelectItem value="Meeting Set">Meeting Set</SelectItem>
                                                <SelectItem value="Interested">Interested</SelectItem>
                                                <SelectItem value="Not Interested">Not Interested</SelectItem>
                                                <SelectItem value="No Answer">No Answer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Notes / Summary (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What was discussed?"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Saving...' : 'Save Log'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
