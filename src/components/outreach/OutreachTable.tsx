'use client'

import React from 'react'
import Link from 'next/link'
import {
    MessageSquare, Mail, Phone, ExternalLink,
    MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OutreachLog } from './types'

interface OutreachTableProps {
    logs: OutreachLog[]
    isAdmin: boolean
    isMounted: boolean
    onEdit: (log: OutreachLog) => void
    onDelete: (log: OutreachLog) => void
}

function getChannelIcon(channel: string) {
    if (channel === 'Email') return <Mail className="h-3.5 w-3.5" />
    if (channel === 'Call') return <Phone className="h-3.5 w-3.5" />
    if (channel === 'LinkedIn') return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
    return <MessageSquare className="h-3.5 w-3.5" />
}

function getStatusStyle(status: string): string {
    if (['Replied', 'Meeting Set', 'Interested'].includes(status))
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    if (['Bounced', 'Not Interested'].includes(status))
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    return 'bg-muted text-muted-foreground'
}

export const OutreachTable = React.memo(({ logs, isAdmin, isMounted, onEdit, onDelete }: OutreachTableProps) => {
    return (
        <div className="rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="px-5 py-3.5">Client</th>
                            <th className="px-5 py-3.5">Channel</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5 hidden md:table-cell">Notes</th>
                            <th className="px-5 py-3.5 text-right">Date</th>
                            {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-5 py-4">
                                    <Link
                                        href={`/clients/${log.client_id}`}
                                        className="font-semibold text-foreground hover:text-primary hover:underline flex items-center gap-1.5 transition-colors"
                                    >
                                        {log.clients?.name ?? 'Unknown'}
                                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    </Link>
                                    {log.clients?.company && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{log.clients.company}</p>
                                    )}
                                </td>

                                <td className="px-5 py-4">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        {getChannelIcon(log.channel)}
                                        {log.channel}
                                    </span>
                                </td>

                                <td className="px-5 py-4">
                                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusStyle(log.status)}`}>
                                        {log.status}
                                    </span>
                                </td>

                                <td className="px-5 py-4 hidden md:table-cell max-w-[240px]">
                                    <p className="text-xs text-muted-foreground truncate">
                                        {log.notes ?? <span className="opacity-40">—</span>}
                                    </p>
                                </td>

                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                    <span className="text-xs text-muted-foreground">
                                        {isMounted ? new Date(log.contacted_at).toLocaleString([], {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        }) : '...'}
                                    </span>
                                </td>

                                {isAdmin && (
                                    <td className="px-5 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem
                                                    onClick={() => onEdit(log)}
                                                    className="gap-2"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit Entry
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(log)}
                                                    className="text-destructive focus:text-destructive font-semibold gap-2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete Entry
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
})

OutreachTable.displayName = 'OutreachTable'
