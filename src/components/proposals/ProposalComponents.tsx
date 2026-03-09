'use client'

import React from 'react'
import Link from 'next/link'
import { MoreHorizontal, Send, ExternalLink, Copy, ArrowRight, Trash2 } from 'lucide-react'
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
import { Proposal, STATUS_CONFIG } from './types'

interface ProposalRowProps {
    proposal: Proposal
    onDelete: () => void
    onCopyLink: () => void
    onPublish: () => void
    onSendEmail: () => void
}

export const ProposalRow = React.memo(({
    proposal,
    onDelete,
    onCopyLink,
    onPublish,
    onSendEmail,
}: ProposalRowProps) => {
    const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft

    return (
        <tr className="group hover:bg-muted/20 transition-colors">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate max-w-[200px]">
                        {proposal.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {proposal.id.slice(0, 8)}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{proposal.clients.name}</span>
                    <span className="text-[11px] text-muted-foreground">{proposal.clients.company || 'Private Client'}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <Badge className={`${status.color} border-0 shadow-none hover:opacity-90 flex items-center w-fit gap-1.5 px-3 py-1 rounded-full text-[10px]`}>
                    <status.icon className="h-3 w-3" />
                    {status.label}
                </Badge>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm font-bold text-emerald-600 font-mono">
                    {formatCurrency(proposal.total_value || 0)}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-48 shadow-xl">
                        {proposal.status === 'draft' && (
                            <DropdownMenuItem onClick={onPublish} className="text-primary font-semibold gap-2">
                                <Send className="h-4 w-4" />
                                Publish Now
                            </DropdownMenuItem>
                        )}
                        {proposal.status !== 'draft' && (
                            <>
                                <DropdownMenuItem
                                    render={<Link href={`/portal?token=${proposal.token}`} target="_blank" className="flex items-center gap-2" />}
                                    className="font-medium"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    View Live Portal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onSendEmail} className="text-blue-600 font-semibold gap-2">
                                    <Send className="h-4 w-4" />
                                    Send in Email
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem onClick={onCopyLink} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            render={<Link href={`/clients/${proposal.client_id}`} className="flex items-center gap-2" />}
                        >
                            <ArrowRight className="h-4 w-4" />
                            Go to Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive group font-semibold gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Proposal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
})

ProposalRow.displayName = 'ProposalRow'

export const ProposalKPICard = React.memo(({ title, value, icon: Icon, color, bg }: {
    title: string
    value: string
    icon: any
    color: string
    bg: string
}) => {
    return (
        <div className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                <div className={`${bg} ${color} p-2 rounded-xl`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
})

ProposalKPICard.displayName = 'ProposalKPICard'
