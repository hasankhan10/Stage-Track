'use client'

import React from 'react'
import Link from 'next/link'
import {
    MoreHorizontal,
    Mail,
    Phone,
    Globe,
    ArrowUpRight,
    TrendingUp,
    Clock,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface Client {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    website: string | null
    stage: string
    deal_value: number | null
    updated_at: string
}

interface ClientRowProps {
    client: Client
    onDelete?: (id: string) => void
}

export const ClientRow = React.memo(({ client, onDelete }: ClientRowProps) => {
    return (
        <tr className="group hover:bg-muted/30 transition-all duration-300 border-b border-border/40 last:border-0">
            <td className="py-5 px-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black shadow-sm border border-primary/10 group-hover:scale-110 transition-transform">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/clients/${client.id}`}
                            className="text-sm font-black text-slate-900 hover:text-primary transition-colors block truncate tracking-tight"
                        >
                            {client.name}
                        </Link>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                            {client.company || 'Private Entity'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="py-5 px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <Mail className="h-3 w-3 text-muted-foreground/40" />
                        <span className="truncate max-w-[150px]">{client.email || '—'}</span>
                    </div>
                    {client.phone && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                            <Phone className="h-3 w-3 text-muted-foreground/40" />
                            <span>{client.phone}</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="py-5 px-4">
                <Badge variant="outline" className={cn(
                    "rounded-full px-3 py-0.5 border-transparent font-black text-[9px] uppercase tracking-widest shadow-sm",
                    client.stage === 'Closed' ? "bg-emerald-500/10 text-emerald-600" :
                        client.stage === 'Proposal' ? "bg-blue-500/10 text-blue-600" :
                            client.stage === 'Negotiation' ? "bg-amber-500/10 text-amber-600" :
                                "bg-slate-500/10 text-slate-600"
                )}>
                    {client.stage}
                </Badge>
            </td>
            <td className="py-5 px-4">
                <div className="flex items-center gap-1.5 font-mono text-xs font-black text-slate-800">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {formatCurrency(client.deal_value || 0)}
                </div>
            </td>
            <td className="py-5 px-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    <Clock className="h-3 w-3 opacity-40" />
                    {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
                </div>
            </td>
            <td className="py-5 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-premium border-border/40">
                            <DropdownMenuItem
                                render={<Link href={`/clients/${client.id}`} className="flex items-center gap-2" />}
                                className="p-2.5 font-bold text-xs rounded-lg cursor-pointer"
                            >
                                <Briefcase className="h-3.5 w-3.5" /> Open Dossier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                render={<Link href={`/clients/${client.id}?tab=proposals`} className="flex items-center gap-2" />}
                                className="p-2.5 font-bold text-xs rounded-lg cursor-pointer"
                            >
                                <Globe className="h-3.5 w-3.5" /> View Logistics
                            </DropdownMenuItem>
                            <div className="h-px bg-border/40 my-1" />
                            <DropdownMenuItem
                                className="p-2.5 font-bold text-xs rounded-lg cursor-pointer text-destructive focus:bg-destructive/10"
                                onClick={() => onDelete?.(client.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Decommission Client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    )
})

ClientRow.displayName = 'ClientRow'

import { Trash2 } from 'lucide-react'
