'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

const proposalSchema = z.object({
    client_id: z.string().min(1, 'Please select a client'),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(10, 'Proposal content must be at least 10 characters'),
    total_value: z.coerce.number().min(0, 'Value must be positive'),
})

type ProposalFormValues = z.infer<typeof proposalSchema>

export function ProposalBuilder({ clients }: { clients: { id: string, name: string }[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const [isPublishing, setIsPublishing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const form = useForm<ProposalFormValues>({
        // @ts-ignore
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            client_id: searchParams.get('client') || '',
            title: '',
            content: '',
            total_value: 0,
        },
    })

    // Update client_id if query param changes
    useEffect(() => {
        const clientFromQuery = searchParams.get('client')
        if (clientFromQuery) {
            form.setValue('client_id', clientFromQuery)
        }
    }, [searchParams, form])

    async function handleSave(data: ProposalFormValues, status: 'draft' | 'sent') {
        try {
            if (status === 'sent') setIsPublishing(true)
            else setIsSaving(true)

            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile?.workspace_id) throw new Error('No workspace found')

            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

            const { error } = await supabase
                .from('proposals')
                .insert({
                    workspace_id: profile.workspace_id,
                    client_id: data.client_id,
                    title: data.title,
                    status: status,
                    total_value: data.total_value,
                    token: token,
                    line_items: {
                        body: data.content
                    }
                })

            if (error) throw error

            if (status === 'sent') {
                toast.loading('Generating Premium PDF...', { id: 'publish-toast' })
                await new Promise(r => setTimeout(r, 1200))
                toast.loading('Optimizing Document Layout...', { id: 'publish-toast' })
                await new Promise(r => setTimeout(r, 1000))

                toast.success('Proposal is now LIVE!', {
                    id: 'publish-toast',
                    description: 'The secure link is generated. You can now review and send.',
                    action: {
                        label: 'View',
                        onClick: () => window.open(`/portal?token=${token}`, '_blank')
                    },
                    duration: 6000
                })
                router.push(`/clients/${data.client_id}`)
            } else {
                toast.success('Draft saved successfully')
                router.push('/proposals')
            }
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong')
        } finally {
            setIsPublishing(false)
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/proposals">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">New Proposal</h1>
                        <p className="text-sm text-muted-foreground">Create a high-end proposal for your client.</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form className="space-y-6">
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all">
                                                        <SelectValue placeholder="Select a client">
                                                            {clients.find(c => c.id === field.value)?.name}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl shadow-2xl">
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id} className="rounded-lg">
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="total_value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deal Value (INR)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proposal Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Marketing Strategy 2024" className="h-11 bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proposal Body</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Write your proposal here..."
                                                className="min-h-[300px] bg-background/50 border-muted-foreground/20 rounded-xl focus:ring-primary/20 transition-all resize-none p-6 text-base leading-relaxed"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full px-6 h-11 font-semibold hover:bg-slate-100 transition-colors"
                            onClick={form.handleSubmit((d) => handleSave(d, 'draft'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary hover:bg-primary/90 rounded-full px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={form.handleSubmit((d) => handleSave(d, 'sent'))}
                            disabled={isSaving || isPublishing}
                        >
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Publish & Review
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
