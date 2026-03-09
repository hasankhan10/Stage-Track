'use client'

import React from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Client } from './types'

interface DeleteClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: Client | null
    onDelete: () => void
    deleting: boolean
}

export const DeleteClientDialog = React.memo(({
    open,
    onOpenChange,
    client,
    onDelete,
    deleting
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
                        Permanently delete <strong>{client?.name}</strong>?
                        This action cannot be undone and will remove all associated data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2 text-right space-x-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={deleting}
                        className="gap-2 shadow-premium"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete Permanently
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

DeleteClientDialog.displayName = 'DeleteClientDialog'
