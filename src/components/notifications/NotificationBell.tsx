'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, Check, Trash2, Info, Receipt, FileText, CheckCircle2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: 'invoice' | 'proposal' | 'task' | 'system'
    link?: string
    read_at: string | null
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
        fetchNotifications()

        // Real-time subscription
        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)
                    toast.info(`New Notification: ${newNotif.title}`)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchNotifications() {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching notifications:', error.message, error)
            return
        }

        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read_at).length || 0)
    }

    async function markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            toast.error('Failed to mark as read')
            return
        }

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    async function markAllAsRead() {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userData.user.id)
            .is('read_at', null)

        if (error) {
            toast.error('Failed to mark all as read')
            return
        }

        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
        setUnreadCount(0)
        toast.success('All marked as read')
    }

    async function clearAll() {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userData.user.id)

        if (error) {
            toast.error('Failed to clear notifications')
            return
        }

        setNotifications([])
        setUnreadCount(0)
        toast.success('Notifications cleared')
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice': return <Receipt className="h-4 w-4 text-emerald-500" />
            case 'proposal': return <FileText className="h-4 w-4 text-blue-500" />
            case 'task': return <CheckCircle2 className="h-4 w-4 text-amber-500" />
            default: return <Info className="h-4 w-4 text-gray-500" />
        }
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                render={
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                }
            />
            <PopoverContent align="end" className="w-[380px] p-0 shadow-2xl">
                <div className="flex items-center justify-between p-4 bg-muted/30">
                    <div className="space-y-1">
                        <h4 className="font-semibold leading-none">Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                            You have {unreadCount} unread messages.
                        </p>
                    </div>
                    {notifications.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mark all as read" onClick={markAllAsRead}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Clear all" onClick={clearAll}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <Separator />
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                            <div className="space-y-3">
                                <Bell className="mx-auto h-8 w-8 opacity-20" />
                                <p className="text-sm">No notifications yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-muted/50">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "flex gap-4 p-4 transition-colors hover:bg-muted/30 cursor-pointer relative group",
                                        !notif.read_at && "bg-primary/5"
                                    )}
                                    onClick={() => !notif.read_at && markAsRead(notif.id)}
                                >
                                    <div className="mt-1 shrink-0">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("text-sm font-medium leading-none truncate", !notif.read_at && "font-bold pr-4")}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5" suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notif.message}
                                        </p>
                                        {notif.link && (
                                            <Link
                                                href={notif.link}
                                                className="text-[10px] items-center flex text-primary hover:underline gap-1 mt-1"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                View details <Check className="h-2 w-2" />
                                            </Link>
                                        )}
                                    </div>
                                    {!notif.read_at && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <Separator />
                <div className="p-2 bg-muted/10">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
