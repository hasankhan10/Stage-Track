'use client'

import React from 'react'
import { Receipt, MoreHorizontal, Send, ExternalLink, Trash2 } from 'lucide-react'
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

export interface Invoice {
    id: string
    status: 'unpaid' | 'paid' | 'overdue' | 'draft'
    total: number
    created_at: string
    line_items: any
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
    unpaid: { label: 'Unpaid', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
    overdue: { label: 'Overdue', color: 'bg-rose-100 text-rose-700' },
}

interface InvoiceItemProps {
    invoice: Invoice
    onPublish: (inv: Invoice) => void
    onSendEmail: (inv: Invoice) => void
    onMarkPaid: (inv: Invoice) => void
    onDeleteRequest: (inv: Invoice) => void
}

export const InvoiceItem = React.memo(({
    invoice,
    onPublish,
    onSendEmail,
    onMarkPaid,
    onDeleteRequest
}: InvoiceItemProps) => {
    const isDraft = invoice.line_items?.is_draft
    const computedStatus = isDraft ? 'draft' : invoice.status
    const status = STATUS_CONFIG[computedStatus] || { label: computedStatus, color: 'bg-slate-100 text-slate-700' }
    const invNumber = invoice.line_items?.invoice_number || `INV-${invoice.id.slice(0, 6)}`

    return (
        <div className="bg-card border rounded-xl p-4 flex items-center justify-between hover:shadow-premium transition-all duration-300 group">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                    <Receipt className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm leading-none mb-1.5">{invNumber}</h4>
                    <div className="flex items-center gap-3">
                        <Badge className={`${status.color} border-0 shadow-none text-[10px] px-2 py-0 h-5`}>
                            {status.label}
                        </Badge>
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                            {formatCurrency(invoice.total / 100)}
                        </span>
                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                            {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground focus:outline-none">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-52 shadow-premium">
                        {isDraft && (
                            <>
                                <DropdownMenuItem onClick={() => onPublish(invoice)} className="text-primary font-bold gap-2 focus:bg-primary/5">
                                    <Send className="h-4 w-4" />
                                    Publish Now
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')} className="gap-2 font-medium focus:bg-primary/5">
                                    <ExternalLink className="h-4 w-4" />
                                    Live Preview
                                </DropdownMenuItem>
                            </>
                        )}
                        {!isDraft && (
                            <>
                                <DropdownMenuItem onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')} className="gap-2 font-medium focus:bg-primary/5">
                                    <ExternalLink className="h-4 w-4" />
                                    View Live Portal
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSendEmail(invoice)} className="text-blue-600 font-bold gap-2 focus:bg-blue-50">
                                    <Send className="h-4 w-4" />
                                    Send in Email
                                </DropdownMenuItem>
                                {invoice.status !== 'paid' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onMarkPaid(invoice)} className="text-emerald-600 font-bold gap-2 focus:bg-emerald-50">
                                            Mark as Paid
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDeleteRequest(invoice)}
                            className="text-destructive font-bold gap-2 focus:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Invoice
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})

InvoiceItem.displayName = 'InvoiceItem'
