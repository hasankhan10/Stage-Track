'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    KanbanSquare,
    Users,
    CheckSquare,
    MessageSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
    Shield,
    FileText,
    ReceiptText,
    LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Core views for all users
const coreNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Outreach', href: '/outreach', icon: MessageSquare },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
]

// Business documents — visible to all
const docsNavItems = [
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: ReceiptText },
]

// Admin-only items
const adminNavItems = [
    { name: 'Analytics', href: '/analytics', icon: Activity },
    { name: 'Team', href: '/team', icon: Shield },
]

// Always last
const bottomNavItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
]

function NavSection({
    items,
    label,
    collapsed,
    pathname,
}: {
    items: { name: string; href: string; icon: React.ElementType }[]
    label?: string
    collapsed: boolean
    pathname: string
}) {
    return (
        <div className="mb-1">
            {label && !collapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {label}
                </p>
            )}
            {collapsed && label && <div className="mx-auto w-6 border-t border-border/40 my-2" />}
            <ul className="space-y-0.5">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    collapsed && "justify-center px-2"
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                                )}
                                <item.icon className={cn(
                                    "h-4 w-4 flex-shrink-0 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!collapsed && (
                                    <span className="truncate">{item.name}</span>
                                )}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export function Sidebar({
    collapsed,
    setCollapsed,
    isMobileOpen,
    onCloseMobile
}: {
    collapsed: boolean
    setCollapsed: (val: boolean) => void
    isMobileOpen?: boolean
    onCloseMobile?: () => void
}) {
    const pathname = usePathname()
    const [role, setRole] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role, name, email')
                    .eq('id', user.id)
                    .single()
                setRole(profile?.role || 'member')
                setUserName(profile?.name || user.email?.split('@')[0] || 'User')
                setUserEmail(profile?.email || user.email || '')
            }
        }
        getProfile()
    }, [supabase])

    const isAdmin = role === 'admin'

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 md:sticky md:flex flex-col border-r bg-sidebar h-screen transition-all duration-300 ease-in-out",
                collapsed ? "w-[70px]" : "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
        >
            {/* Logo */}
            <div className="flex h-14 items-center flex-shrink-0 px-3 border-b">
                {collapsed ? (
                    <div className="w-full flex items-center justify-center">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                            ST
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm flex-shrink-0">
                            ST
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm leading-tight text-foreground whitespace-nowrap">StageTrack</p>
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap">Agency CRM</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                <NavSection items={coreNavItems} label="Workspace" collapsed={collapsed} pathname={pathname} />
                <NavSection items={docsNavItems} label="Documents" collapsed={collapsed} pathname={pathname} />
                {isAdmin && (
                    <NavSection items={adminNavItems} label="Admin" collapsed={collapsed} pathname={pathname} />
                )}
                <NavSection items={bottomNavItems} collapsed={collapsed} pathname={pathname} />
            </nav>

            {/* User Profile Footer */}
            <div className={cn("border-t p-3 flex items-center gap-3", collapsed && "justify-center flex-col gap-2")}>
                {!collapsed && (
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {userName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate text-foreground">{userName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                        </div>
                    </div>
                )}
                <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        title="Log out"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </aside>
    )
}
