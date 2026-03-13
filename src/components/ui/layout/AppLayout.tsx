'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { createClient } from '@/utils/supabase/client'

export function AppLayout({ children }: { children: React.ReactNode }) {
    // Start with stable initial state that matches SSR output exactly
    const [mounted, setMounted] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    // After hydration, apply user's saved preference
    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved === 'true') setCollapsed(true)
    }, [])

    function handleSetCollapsed(val: boolean) {
        setCollapsed(val)
        localStorage.setItem('sidebar-collapsed', String(val))
    }

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
                    await supabase.from('users')
                        .update({ last_login_at: new Date().toISOString() })
                        .eq('id', user.id)
                }
            }
        }
        updateLoginStatus()
    }, [supabase])

    return (
        // suppressHydrationWarning prevents React from complaining about
        // class differences caused by client-only state (collapsed, mounted)
        <div className="flex min-h-screen w-full bg-background overflow-hidden relative" suppressHydrationWarning>
            {mounted && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Render sidebar after mount to prevent SSR/CSR class mismatch */}
            {mounted ? (
                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={handleSetCollapsed}
                    isMobileOpen={isMobileMenuOpen}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
            ) : (
                // Stable SSR placeholder — same width as expanded sidebar
                <div className="w-64 flex-shrink-0 border-r bg-sidebar h-screen" aria-hidden />
            )}

            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8" suppressHydrationWarning>
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
