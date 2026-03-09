'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface Milestone {
    id: string
    title: string
    description?: string
    status: 'pending' | 'complete'
    due_date?: string
    completed_at?: string
}

interface MilestoneTrackerProps {
    clientId: string
}

export function MilestoneTracker({ clientId }: MilestoneTrackerProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDueDate, setNewDueDate] = useState('')
    const supabase = useMemo(() => createClient(), [])

    const fetchMilestones = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('milestones')
                .select('*')
                .eq('client_id', clientId)
                .order('due_date', { ascending: true })

            if (error) throw error
            setMilestones(data || [])
        } catch (error) {
            toast.error('Failed to load milestones')
        } finally {
            setIsLoading(false)
        }
    }, [clientId, supabase])

    useEffect(() => {
        fetchMilestones()
    }, [fetchMilestones])

    async function handleAddMilestone() {
        if (!newTitle) return

        try {
            const { data, error } = await supabase
                .from('milestones')
                .insert({
                    client_id: clientId,
                    title: newTitle,
                    due_date: newDueDate || null,
                    status: 'pending'
                })
                .select()
                .single()

            if (error) throw error

            setMilestones(prev => [...prev, data].sort((a, b) => {
                if (!a.due_date) return 1
                if (!b.due_date) return -1
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            }))

            setNewTitle('')
            setNewDueDate('')
            setIsAdding(false)
            toast.success('Milestone added')
        } catch (error) {
            toast.error('Failed to add milestone')
        }
    }

    async function toggleMilestone(milestone: Milestone) {
        const newStatus = milestone.status === 'pending' ? 'complete' : 'pending'
        const completedAt = newStatus === 'complete' ? new Date().toISOString() : null

        try {
            const { error } = await supabase
                .from('milestones')
                .update({
                    status: newStatus,
                    completed_at: completedAt
                })
                .eq('id', milestone.id)

            if (error) throw error

            setMilestones(prev =>
                prev.map(m => m.id === milestone.id ? { ...m, status: newStatus, completed_at: completedAt || undefined } : m)
            )

            toast.success(`Milestone marked as ${newStatus}`)
        } catch (error) {
            toast.error('Failed to update milestone')
        }
    }

    async function deleteMilestone(id: string) {
        try {
            const { error } = await supabase
                .from('milestones')
                .delete()
                .eq('id', id)

            if (error) throw error

            setMilestones(prev => prev.filter(m => m.id !== id))
            toast.success('Milestone deleted')
        } catch (error) {
            toast.error('Failed to delete milestone')
        }
    }

    const completedCount = milestones.filter(m => m.status === 'complete').length
    const progressPercent = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
                    <span className="text-2xl font-bold">{Math.round(progressPercent)}%</span>
                </CardHeader>
                <CardContent>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {completedCount} of {milestones.length} milestones completed
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold px-1">Milestones</h3>
                    {!isAdding && (
                        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Milestone
                        </Button>
                    )}
                </div>

                {isAdding && (
                    <Card className="border-dashed bg-muted/20">
                        <CardContent className="pt-6 space-y-3">
                            <Input
                                placeholder="Milestone title..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    className="w-full"
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setIsAdding(false)} disabled={isLoading}>Cancel</Button>
                                    <Button onClick={async () => {
                                        setIsLoading(true);
                                        await handleAddMilestone();
                                        setIsLoading(false);
                                    }} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {isLoading ? "Adding..." : "Add"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    {milestones.length === 0 && !isAdding && (
                        <div className="text-center py-8 border rounded-lg bg-muted/10">
                            <p className="text-sm text-muted-foreground">No milestones defined for this project.</p>
                        </div>
                    )}

                    {milestones.map((milestone) => (
                        <div
                            key={milestone.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors group ${milestone.status === 'complete' ? 'bg-muted/30 border-muted' : 'bg-card shadow-sm'
                                }`}
                        >
                            <button
                                onClick={() => toggleMilestone(milestone)}
                                className={`mt-1 shrink-0 ${milestone.status === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                {milestone.status === 'complete' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${milestone.status === 'complete' ? 'line-through text-muted-foreground' : ''}`}>
                                    {milestone.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    {milestone.due_date && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(milestone.due_date), 'MMM d')}
                                        </span>
                                    )}
                                    {milestone.completed_at && (
                                        <span className="text-xs text-primary font-medium">
                                            Completed on {format(new Date(milestone.completed_at), 'MMM d')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMilestone(milestone.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
