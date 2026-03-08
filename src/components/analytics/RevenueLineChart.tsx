'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

export function RevenueLineChart() {
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true)

                // Get invoices from last 6 months
                const sixMonthsAgo = subMonths(new Date(), 6)
                const { data: invoices, error } = await supabase
                    .from('invoices')
                    .select('total, paid_at')
                    .eq('status', 'Paid')
                    .gte('paid_at', sixMonthsAgo.toISOString())

                if (error) throw error

                // Generate last 6 months
                const months = eachMonthOfInterval({
                    start: sixMonthsAgo,
                    end: new Date()
                })

                const chartData = months.map(month => {
                    const monthStart = startOfMonth(month)
                    const monthEnd = endOfMonth(month)

                    const monthRevenue = invoices?.filter(inv => {
                        const paidDate = new Date(inv.paid_at)
                        return paidDate >= monthStart && paidDate <= monthEnd
                    }).reduce((sum, inv) => sum + inv.total, 0) || 0

                    return {
                        month: format(month, 'MMM'),
                        revenue: monthRevenue
                    }
                })

                setData(chartData)
            } catch (error) {
                console.error('Error fetching revenue chart:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full" />
    }

    return (
        <Card className="col-span-1 shadow-sm border-none bg-card">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis
                                dataKey="month"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'currentColor', opacity: 0.6 }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                                tick={{ fill: 'currentColor', opacity: 0.6 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
