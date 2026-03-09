'use client'

import { useState, useCallback, useMemo } from 'react'
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
    DialogFooter,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Loader2, Sparkles } from 'lucide-react'
import { TaskFormFields } from './TaskFormFields'

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.string(),
    due_date: z.string().optional(),
    client_id: z.string().optional(),
    assigned_to: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

interface CreateTaskDialogProps {
    clients?: { id: string, name: string }[]
    users?: { id: string, name: string }[]
    defaultClientId?: string
    children?: React.ReactNode
}

export function CreateTaskDialog({ clients = [], users = [], defaultClientId, children }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'Medium',
            client_id: defaultClientId || 'none',
            assigned_to: 'none',
        },
    })

    const onSubmit = useCallback(async (data: TaskFormValues) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            const newTask = {
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: 'Pending',
                due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
                client_id: data.client_id !== 'none' ? data.client_id : null,
                assigned_to: data.assigned_to !== 'none' ? data.assigned_to : userData.user.id,
                workspace_id: profile.workspace_id,
                created_by: userData.user.id,
            }

            const { error } = await supabase.from('tasks').insert(newTask)
            if (error) throw error

            toast.success('Task Objective Synced')
            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to sync task')
        }
    }, [supabase, form, router])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    (children as any) || (
                        <Button className="rounded-full shadow-premium font-bold h-10 px-6">
                            <Plus className="mr-2 h-4 w-4" />
                            Initiate Task
                        </Button>
                    )
                }
            />
            <DialogContent className="sm:max-w-[520px] rounded-[1.5rem] border-border/40 overflow-hidden bg-card/95 backdrop-blur-xl">
                <DialogHeader className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <DialogTitle className="text-xl font-black tracking-tight tracking-[-0.02em]">Create New Task</DialogTitle>
                    </div>
                    <DialogDescription className="font-medium text-muted-foreground/80">
                        Define high-level objectives and assign them for execution.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <TaskFormFields
                            form={form}
                            clients={clients}
                            users={users}
                            defaultClientId={defaultClientId}
                        />

                        <DialogFooter className="pt-2 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-full font-bold h-11 px-8 hover:bg-slate-100"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="rounded-full h-11 px-10 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        Initiate Now
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
