'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, ShieldAlert } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Notification, NotificationItem, NotificationHeader } from './NotificationComponents'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        setMounted(true)
        fetchNotifications()

        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)
                    toast.info(`Protocol Alert: ${newNotif.title}`, {
                        description: newNotif.message,
                        action: { label: 'Review', onClick: () => setIsOpen(true) }
                    })
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    const fetchNotifications = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) return
        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read_at).length || 0)
    }, [supabase])

    const markAsRead = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)

        if (error) { toast.error('Acknowledgement Failed'); return }

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
    }, [supabase])

    const markAllAsRead = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userData.user.id)
            .is('read_at', null)

        if (error) { toast.error('Bulk Acknowledgement Failed'); return }

        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
        setUnreadCount(0)
        toast.success('Protocol Cleared')
    }, [supabase])

    const clearAll = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userData.user.id)

        if (error) { toast.error('Purge Failed'); return }

        setNotifications([])
        setUnreadCount(0)
        toast.info('Intelligence Logs Purged')
    }, [supabase])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground transition-all rounded-full focus:outline-none">
                <Bell className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                render={
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow-lg shadow-primary/30 border-2 border-background animate-in zoom-in pointer-events-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                }
            />
            <PopoverContent align="end" className="w-[420px] p-0 shadow-premium border-border/40 rounded-[1.5rem] overflow-hidden bg-card/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
                <NotificationHeader
                    unreadCount={unreadCount}
                    hasNotifications={notifications.length > 0}
                    onMarkAll={markAllAsRead}
                    onClearAll={clearAll}
                />

                <Separator className="bg-border/40" />

                <ScrollArea className="h-[450px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-full items-center justify-center py-20 px-8 text-center bg-muted/5 animate-in fade-in duration-700">
                            <div className="space-y-4">
                                <div className="h-16 w-16 bg-muted/30 rounded-3xl flex items-center justify-center mx-auto border border-border/20 shadow-sm">
                                    <ShieldAlert className="h-8 w-8 text-muted-foreground/20" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 tracking-tight tracking-[-0.01em]">Intelligence Silence</p>
                                    <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-[0.1em] mt-1">System is fully synchronized.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {notifications.map((notif) => (
                                <NotificationItem
                                    key={notif.id}
                                    notification={notif}
                                    onRead={markAsRead}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <Separator className="bg-border/40" />

                <div className="p-4 bg-muted/20 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full h-10 text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:bg-muted/40 transition-all rounded-xl" onClick={() => setIsOpen(false)}>
                        Minimize Feed
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
