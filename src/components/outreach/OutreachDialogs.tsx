'use client'

import React from 'react'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Pencil, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { OutreachLog, Channel, OutreachStatus, CHANNELS, ALL_STATUSES } from './types'

interface EditLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    log: OutreachLog | null
    channel: Channel
    setChannel: (val: Channel) => void
    status: OutreachStatus
    setStatus: (val: OutreachStatus) => void
    notes: string
    setNotes: (val: string) => void
    onSave: () => void
    saving: boolean
}

export const EditLogDialog = ({
    open,
    onOpenChange,
    log,
    channel,
    setChannel,
    status,
    setStatus,
    notes,
    setNotes,
    onSave,
    saving,
}: EditLogDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary" />
                        Edit Log Entry
                    </DialogTitle>
                    <DialogDescription>
                        Update the channel, outcome, or notes for this outreach entry.
                        {log && (
                            <span className="block mt-1 font-semibold text-foreground">
                                Client: {log.clients?.name ?? 'Unknown'}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Channel</label>
                            <select
                                value={channel}
                                onChange={e => setChannel(e.target.value as Channel)}
                                className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Status / Outcome</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as OutreachStatus)}
                                className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Notes</label>
                        <textarea
                            className="w-full min-h-[90px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="What was discussed?"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    log: OutreachLog | null
    onDelete: () => void
    deleting: boolean
}

export const DeleteLogDialog = ({
    open,
    onOpenChange,
    log,
    onDelete,
    deleting,
}: DeleteLogDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Log Entry
                    </DialogTitle>
                    <DialogDescription>
                        Permanently delete this outreach entry for{' '}
                        <strong>{log?.clients?.name ?? 'this client'}</strong>?
                        This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete Entry
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
