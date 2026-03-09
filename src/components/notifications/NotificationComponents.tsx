'use client'

import React from 'react'
import { Bell, Check, Trash2, Info, Receipt, FileText, CheckCircle2, MoreHorizontal, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'invoice' | 'proposal' | 'task' | 'system'
    link?: string
    read_at: string | null
    created_at: string
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION ITEM
   ────────────────────────────────────────────────────────────────────────── */

interface NotificationItemProps {
    notification: Notification
    onRead: (id: string) => void
    onClose: () => void
}

export const NotificationItem = React.memo(({ notification, onRead, onClose }: NotificationItemProps) => {
    const isUnread = !notification.read_at

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice': return <Receipt className="h-4 w-4 text-emerald-500" />
            case 'proposal': return <FileText className="h-4 w-4 text-blue-500" />
            case 'task': return <CheckCircle2 className="h-4 w-4 text-amber-500" />
            default: return <Info className="h-4 w-4 text-primary" />
        }
    }

    return (
        <div
            className={cn(
                "flex gap-4 p-5 transition-all duration-300 hover:bg-muted/40 cursor-pointer relative group border-l-2 border-transparent",
                isUnread && "bg-primary/[0.03] border-l-primary"
            )}
            onClick={() => isUnread && onRead(notification.id)}
        >
            <div className={cn(
                "mt-0.5 shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                isUnread ? "bg-primary/10 shadow-sm" : "bg-muted shadow-none"
            )}>
                {getIcon(notification.type)}
            </div>
            <div className="flex-1 space-y-1.5 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                        "text-sm tracking-tight leading-tight truncate",
                        isUnread ? "font-black text-slate-900" : "font-semibold text-slate-500"
                    )}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap pt-0.5 uppercase tracking-tighter" suppressHydrationWarning>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className={cn(
                    "text-[11px] leading-relaxed line-clamp-2",
                    isUnread ? "text-slate-600 font-medium" : "text-slate-400 font-normal"
                )}>
                    {notification.message}
                </p>
                {notification.link && (
                    <Link
                        href={notification.link}
                        className="text-[10px] items-center flex text-primary hover:text-primary/80 font-bold gap-1 pt-1.5 transition-colors group/link"
                        onClick={onClose}
                    >
                        Review Protocol <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                )}
            </div>
            {isUnread && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse" />
            )}
        </div>
    )
})

NotificationItem.displayName = 'NotificationItem'

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION HEADER
   ────────────────────────────────────────────────────────────────────────── */

interface NotificationHeaderProps {
    unreadCount: number
    hasNotifications: boolean
    onMarkAll: () => void
    onClearAll: () => void
}

export const NotificationHeader = React.memo(({ unreadCount, hasNotifications, onMarkAll, onClearAll }: NotificationHeaderProps) => {
    return (
        <div className="flex flex-col gap-4 p-6 bg-muted/20 border-b border-border/40">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h4 className="text-lg font-black tracking-tight tracking-[-0.02em] uppercase tracking-[0.05em] text-slate-900">Intelligence Feed</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        {unreadCount} Unhandled Operations
                    </p>
                </div>
                {hasNotifications && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-border/60 hover:bg-primary/5 hover:text-primary transition-all"
                            title="Acknowledge All"
                            onClick={onMarkAll}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-border/60 text-destructive hover:bg-destructive/10 transition-all"
                            title="Purge Logs"
                            onClick={onClearAll}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
})

NotificationHeader.displayName = 'NotificationHeader'
