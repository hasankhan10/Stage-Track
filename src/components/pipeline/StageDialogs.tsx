'use client'

import React from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, AlertTriangle, Trash2, Globe, IndianRupee } from 'lucide-react'
import { Client } from './types'

interface AddClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    stageName: string
    stageId: number
    form: { name: string; company: string; email: string; phone: string; website: string; deal_value: string }
    setForm: React.Dispatch<React.SetStateAction<{ name: string; company: string; email: string; phone: string; website: string; deal_value: string }>>
    onSubmit: (e: React.FormEvent) => void
    submitting: boolean
}

export const AddClientDialog = ({
    open,
    onOpenChange,
    stageName,
    stageId,
    form,
    setForm,
    onSubmit,
    submitting,
}: AddClientDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Client to {stageName}</DialogTitle>
                    <DialogDescription>
                        This client will be added directly to the <strong>{stageName}</strong> stage.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Full Name *</label>
                            <Input
                                placeholder="Rahul Sharma"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Email</label>
                            <Input
                                type="email"
                                placeholder="rahul@example.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Company</label>
                            <Input
                                placeholder="Infosys Ltd."
                                value={form.company}
                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Phone</label>
                            <Input
                                placeholder="+91 98765 43210"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                Website
                            </label>
                            <Input
                                type="url"
                                placeholder="https://infosys.com"
                                value={form.website}
                                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                            />
                        </div>
                        {stageId >= 6 && (
                            <div className="col-span-2">
                                <label className="text-sm font-medium mb-1 block flex items-center gap-1.5">
                                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                                    Deal Value
                                </label>
                                <Input
                                    type="number"
                                    placeholder="50000"
                                    value={form.deal_value || ''}
                                    onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Add to {stageName}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

interface DeleteClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: Client | null
    onDelete: () => void
    submitting: boolean
}

export const DeleteClientDialog = ({
    open,
    onOpenChange,
    client,
    onDelete,
    submitting,
}: DeleteClientDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Client
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to permanently delete <strong>{client?.name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2 text-right space-x-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={submitting}
                        className="gap-2"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete Permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface NoteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientName: string | undefined
    stageName: string
    noteText: string
    setNoteText: (val: string) => void
    onSave: () => void
    submitting: boolean
}

export const NoteDialog = ({
    open,
    onOpenChange,
    clientName,
    stageName,
    noteText,
    setNoteText,
    onSave,
    submitting,
}: NoteDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Stage Note — {clientName}</DialogTitle>
                    <DialogDescription>Add a note about this client's progress in {stageName}.</DialogDescription>
                </DialogHeader>
                <textarea
                    className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                    placeholder="E.g. Sent LinkedIn message on Monday. Awaiting reply..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                />
                <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSave} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Note
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
