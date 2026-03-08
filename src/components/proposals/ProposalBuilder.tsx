'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

const proposalSchema = z.object({
    client_id: z.string().min(1, 'Please select a client'),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(10, 'Proposal content must be at least 10 characters'),
    deal_value: z.coerce.number().min(0, 'Value must be positive'),
})

type ProposalFormValues = z.infer<typeof proposalSchema>

export function ProposalBuilder({ clients }: { clients: { id: string, name: string }[] }) {
    const router = useRouter()
    const supabase = createClient()
    const [isPublishing, setIsPublishing] = useState(false)

    const form = useForm<ProposalFormValues>({
        // @ts-ignore
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            client_id: '',
            title: '',
            content: '',
            deal_value: 0,
        },
    })

    async function handleSave(data: ProposalFormValues, status: 'Draft' | 'Sent') {
        try {
            if (status === 'Sent') setIsPublishing(true)

            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            // Insert Proposal
            const { data: insertedProposal, error: insertError } = await supabase
                .from('proposals')
                .insert({
                    client_id: data.client_id,
                    workspace_id: profile.workspace_id,
                    title: data.title,
                    content: data.content,
                    deal_value: Math.round(data.deal_value * 100), // Convert to cents
                    status: status,
                    created_by: userData.user.id,
                })
                .select('id')
                .single()

            if (insertError) throw insertError

            // Log Activity
            await supabase.from('activity_log').insert({
                client_id: data.client_id,
                action_type: 'proposal',
                description: `Proposal "${data.title}" was ${status === 'Sent' ? 'published' : 'saved as draft'}`
            })

            if (status === 'Sent') {
                // Create public link
                const { data: newLink, error: linkError } = await supabase
                    .from('client_links')
                    .insert({
                        client_id: data.client_id,
                        workspace_id: profile.workspace_id,
                        link_type: 'proposal',
                    })
                    .select('token')
                    .single()

                if (linkError) throw linkError

                toast.success('Proposal Published!', {
                    description: 'A public token has been generated. The client can now view it.'
                })
                router.push(`/clients/${data.client_id}`)
            } else {
                toast.success('Draft Saved')
                router.push(`/clients/${data.client_id}`)
            }

        } catch (error: any) {
            toast.error(error.message || 'Error processing proposal')
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Proposal Builder</h1>
                        <p className="text-muted-foreground">Draft and send a new proposal to a client.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={form.handleSubmit((d) => handleSave(d as unknown as ProposalFormValues, 'Draft'))}
                        disabled={form.formState.isSubmitting || isPublishing}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button
                        type="button"
                        onClick={form.handleSubmit((d) => handleSave(d as unknown as ProposalFormValues, 'Sent'))}
                        disabled={form.formState.isSubmitting || isPublishing}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {isPublishing ? 'Publishing...' : 'Publish & Send'}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="client_id"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Client</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select target client" />
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

                                <FormField
                                    control={form.control as any}
                                    name="deal_value"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Estimated Value (USD)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control as any}
                                name="title"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Proposal Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Website Redesign & SEO Retainer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="content"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Proposal Content / Statement of Work</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Outline the scope, deliverables, timeline, and terms here..."
                                                className="min-h-[400px] resize-y font-mono text-sm leading-relaxed"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}
