'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { invalidateTasks } from '@/app/(app)/tasks/actions'

interface DeleteTaskButtonProps {
    taskId: string
    taskTitle: string
}

export function DeleteTaskButton({ taskId, taskTitle }: DeleteTaskButtonProps) {
    const [submitting, setSubmitting] = useState(false)
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    const handleDelete = async () => {
        setSubmitting(true)
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId)
            if (error) throw error

            toast.success(`Task "${taskTitle}" permanently deleted.`)
            setOpen(false)
            await invalidateTasks()
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete task')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none p-1 shrink-0 rounded-md hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Delete Task?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the task "{taskTitle}". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="font-semibold rounded-xl">Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="font-bold rounded-xl"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Permanently
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
