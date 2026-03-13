'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [initials, setInitials] = useState('ME')

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', user.id)
                    .single()
                const name = profile?.name || user.email || 'Me'
                const parts = name.trim().split(' ')
                const derived = parts.length >= 2
                    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
                    : name.slice(0, 2)
                setInitials(derived.toUpperCase())
            }
        }
        fetchUser()
    }, [supabase])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background px-4 sm:px-6" suppressHydrationWarning>
            {/* Mobile Menu Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onMenuClick}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>

            {/* Global Search */}
            <div className="flex-1 w-full flex items-center max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search clients..."
                        className="w-full appearance-none bg-background pl-8 shadow-none"
                    />
                </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <NotificationBell />
            </div>
        </header>
    )
}
