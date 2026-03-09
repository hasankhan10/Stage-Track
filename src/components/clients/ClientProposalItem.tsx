'use client'

import React from 'react'
import { FileText, MoreHorizontal, Send, ExternalLink, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/formatters'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Proposal, STATUS_CONFIG } from '../proposals/types'

interface ProposalItemProps {
    proposal: Proposal
    onPublish: (p: Proposal) => void
    onSendEmail: (p: Proposal) => void
    onCopyLink: (token: string) => void
    onDeleteRequest: (p: Proposal) => void
}

export const ClientProposalItem = React.memo(({
    proposal,
    onPublish,
    onSendEmail,
    onCopyLink,
    onDeleteRequest
}: ProposalItemProps) => {
    const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft

    return (
        <div className="bg-card border rounded-xl p-4 flex items-center justify-between hover:shadow-premium transition-all duration-300 group">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm leading-none mb-1.5 truncate max-w-[200px]">{proposal.title}</h4>
                    <div className="flex items-center gap-3">
                        <Badge className={`${status.color} border-0 shadow-none text-[10px] px-2 py-0 h-5 flex items-center`}>
                            <status.icon className="mr-1 h-3 w-3" />
                            {status.label}
                        </Badge>
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                            {formatCurrency(proposal.total_value)}
                        </span>
                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                            {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu drop-down-center>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground focus:outline-none">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-52 shadow-premium">
                        {proposal.status === 'draft' && (
                            <DropdownMenuItem onClick={() => onPublish(proposal)} className="text-primary font-bold gap-2 focus:bg-primary/5">
                                <Send className="h-4 w-4" />
                                Publish Now
                            </DropdownMenuItem>
                        )}
                        {proposal.status !== 'draft' && (
                            <>
                                <DropdownMenuItem
                                    render={<Link href={`/portal?token=${proposal.token}`} target="_blank" className="flex items-center gap-2" />}
                                    className="font-medium focus:bg-muted"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    View Live Portal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSendEmail(proposal)} className="text-blue-600 font-bold gap-2 focus:bg-blue-50">
                                    <Send className="h-4 w-4" />
                                    Send in Email
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={() => onCopyLink(proposal.token)} className="gap-2 font-medium">
                            <Copy className="h-4 w-4" />
                            Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDeleteRequest(proposal)}
                            className="text-destructive font-bold gap-2 focus:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Proposal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})

ClientProposalItem.displayName = 'ClientProposalItem'
