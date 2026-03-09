'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { createClient } from '@/utils/supabase/client'

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        async function updateLoginStatus() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('last_login_at')
                    .eq('id', user.id)
                    .single()

                if (profile && !profile.last_login_at) {
                    await supabase
                        .from('users')
                        .update({ last_login_at: new Date().toISOString() })
                        .eq('id', user.id)
                }
            }
        }
        updateLoginStatus()
    }, [supabase])

    return (
        <div className="flex min-h-screen w-full bg-background overflow-hidden relative" suppressHydrationWarning>
            {/* Mobile Overlay — only rendered after hydration to prevent mismatch */}
            {mounted && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            {/* Main content wrapper */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
