'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, Users, Target, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface KPIStats {
    totalRevenue: number
    activeDeals: number
    totalPipelineValue: number
    conversionRate: number
}

export function KPICards() {
    const [stats, setStats] = useState<KPIStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchStats() {
            try {
                setIsLoading(true)

                // 1. Total Revenue (Paid Invoices)
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total')
                    .eq('status', 'Paid')

                const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0

                // 2. Active Deals (Clients not in Won/Lost - assuming stages 1-10 are active, 11 won, 12 lost based on standard flow)
                // Let's count all clients weighted by stage
                const { data: clients } = await supabase
                    .from('clients')
                    .select('deal_value, stage')

                const activeDeals = clients?.filter(c => c.stage < 11).length || 0
                const totalPipelineValue = clients?.filter(c => c.stage < 11).reduce((sum, c) => sum + (c.deal_value || 0), 0) || 0

                // 3. Conversion Rate: stages 6-11 = Client/Won, stage 12 = Churned/Lost
                const wonDeals = clients?.filter(c => c.stage >= 6 && c.stage <= 11).length || 0
                const totalFinished = clients?.filter(c => c.stage >= 6).length || 0
                const conversionRate = totalFinished > 0 ? (wonDeals / totalFinished) * 100 : 0

                setStats({
                    totalRevenue,
                    activeDeals,
                    totalPipelineValue,
                    conversionRate
                })
            } catch (error) {
                console.error('Error fetching KPI stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const items = [
        {
            title: "Total Revenue",
            value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
            icon: IndianRupee,
            description: "Collected from paid invoices"
        },
        {
            title: "Pipeline Value",
            value: `₹${(stats?.totalPipelineValue || 0).toLocaleString('en-IN')}`,
            icon: Target,
            description: "Potential from active deals"
        },
        {
            title: "Active Deals",
            value: stats?.activeDeals || 0,
            icon: Users,
            description: "Deals currently in progress"
        },
        {
            title: "Conversion Rate",
            value: `${Math.round(stats?.conversionRate || 0)}%`,
            icon: Zap,
            description: "Success rate of closed deals"
        }
    ]

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
                <Card key={i} className="border-none shadow-premium bg-card/60 backdrop-blur-md hover:bg-card transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{item.title}</CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <item.icon className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                            {item.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
