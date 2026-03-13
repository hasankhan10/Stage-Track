'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, History, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ClientNotes({ client }: { client: any }) {
    const [isEditing, setIsEditing] = useState(false)
    const [note, setNote] = useState(client.stage_notes || '')
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleSave() {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('clients')
                .update({ stage_notes: note })
                .eq('id', client.id)

            if (error) throw error
            
            toast.success('Notes synced successfully!', {
                description: 'These notes are now visible on the Pipeline board.'
            })
            setIsEditing(false)
            router.refresh()
        } catch (error: any) {
            toast.error('Failed to sync notes')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Quick Notes & Strategic Context
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Internal team notes that synchronize directly with the Pipeline cards.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setNote(client.stage_notes || '')
                                    setIsEditing(false)
                                }}
                                disabled={saving}
                                className="font-bold gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="shadow-lg shadow-primary/20 font-bold h-10 px-6 gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button 
                            onClick={() => setIsEditing(true)} 
                            variant="outline"
                            className="font-bold h-10 px-6 gap-2 border-primary/20 hover:bg-primary/5 transition-all"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Notes
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative group min-h-[400px]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                {isEditing ? (
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter strategic notes, progress updates, or internal context here..."
                        className="relative min-h-[400px] text-lg p-6 bg-card border-border/50 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                        autoFocus
                    />
                ) : (
                    <div 
                        className="relative min-h-[400px] text-lg p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap cursor-text hover:bg-card/80 transition-all"
                        onClick={() => setIsEditing(true)}
                    >
                        {note || <span className="italic text-muted-foreground/50">No strategic notes added yet. Click edit to begin...</span>}
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-center justify-center pt-6 space-y-2">
               <div className="h-px w-24 bg-border/40" />
               <p className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40">
                   Interactive Two-Way Sync • Pipeline ↔ CRM Profile
               </p>
            </div>
        </div>
    )
}
