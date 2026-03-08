'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    KanbanSquare,
    Users,
    CheckSquare,
    MessageSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Analytics', href: '/analytics', icon: Activity }, // Activity from lucide-react as a chart substitute
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Outreach', href: '/outreach', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
]

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

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 md:sticky md:flex flex-col border-r bg-sidebar h-screen transition-all duration-300",
                collapsed ? "w-16" : "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
        >
            <div className="flex h-16 items-center flex-shrink-0 px-4 border-b">
                <div className={cn("font-bold text-xl text-primary transition-opacity overflow-hidden whitespace-nowrap", collapsed && "opacity-0 w-0")}>
                    StageTrack
                </div>
                {collapsed && <div className="font-bold text-xl text-primary mx-auto">ST</div>}
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        collapsed && "justify-center px-0"
                                    )}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {!collapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t flex items-center justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
            </div>
        </aside>
    )
}
