'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { invalidateTasks } from '@/app/(app)/tasks/actions'
import { cn } from '@/lib/utils'

interface MarkTaskDoneButtonProps {
    taskId: string
    currentStatus: string
    canMarkDone?: boolean
}

export function MarkTaskDoneButton({ taskId, currentStatus, canMarkDone = true }: MarkTaskDoneButtonProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const supabase = createClient()

    const isDone = currentStatus === 'done'

    const toggleStatus = async () => {
        setIsUpdating(true)
        const newStatus = isDone ? 'todo' : 'done'

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId)

            if (error) throw error

            toast.success(isDone ? 'Task reopened' : 'Task completed! Great job.')
            await invalidateTasks()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update task status')
        } finally {
            setIsUpdating(false)
        }
    }

    if (!canMarkDone) {
        return (
            <div className={cn(
                "flex items-center gap-1.5 text-xs font-bold",
                isDone ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            )}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {isDone ? 'Completed' : 'Pending'}
            </div>
        )
    }

    return (
        <button
            onClick={toggleStatus}
            disabled={isUpdating}
            className={cn(
                "flex items-center gap-1.5 text-xs font-bold transition-all focus:outline-none hover:scale-105 active:scale-95",
                isDone
                    ? "text-green-600 hover:text-green-700 dark:text-green-500"
                    : "text-primary hover:text-primary/80",
                isUpdating && "opacity-50 pointer-events-none"
            )}
        >
            {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDone ? (
                <CheckCircle2 className="h-4 w-4" />
            ) : (
                <Circle className="h-4 w-4" />
            )}
            {isDone ? 'Completed' : 'Mark Done'}
        </button>
    )
}
