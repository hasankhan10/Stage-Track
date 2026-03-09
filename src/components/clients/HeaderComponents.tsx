'use client'

import React from 'react'
import {
    ArrowRight,
    Share2,
    Trash2,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PIPELINE_STAGES } from '@/lib/pipeline'

interface HeaderActionsProps {
    currentStage: number
    isUpdating: boolean
    isSharing: boolean
    onStageChange: (newStage: number) => void
    onShare: () => void
    onDeleteRequest: () => void
    editComponent: React.ReactNode
}

export const HeaderActions = React.memo(({
    currentStage,
    isUpdating,
    isSharing,
    onStageChange,
    onShare,
    onDeleteRequest,
    editComponent
}: HeaderActionsProps) => {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {editComponent}

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 hover:bg-muted focus:outline-none transition-colors border-border/60">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" className="w-56 shadow-premium">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2 font-medium">
                            <ArrowRight className="h-4 w-4" />
                            Transfer to Stage
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52 shadow-premium">
                            {PIPELINE_STAGES.map((s) => (
                                <DropdownMenuItem
                                    key={s.id}
                                    disabled={currentStage === s.id || isUpdating}
                                    onClick={() => onStageChange(s.id)}
                                    className={currentStage === s.id ? 'opacity-50 cursor-not-allowed' : 'font-medium'}
                                >
                                    <span className="h-2 w-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: s.color }} />
                                    {s.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem onClick={onShare} disabled={isSharing} className="gap-2 font-medium">
                        <Share2 className="h-4 w-4" />
                        {isSharing ? 'Sharing...' : 'Share Progress'}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive group font-bold gap-2 focus:bg-destructive/10"
                        onClick={onDeleteRequest}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Client
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
})

HeaderActions.displayName = 'HeaderActions'
