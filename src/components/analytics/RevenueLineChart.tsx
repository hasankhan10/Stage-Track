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
        <Card className="col-span-1 shadow-2xl shadow-slate-200/40 border border-slate-100 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100/50 bg-white/40 pb-4">
                <CardTitle className="text-lg font-black text-slate-800">Actual Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis
                                dataKey="month"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontWeight: 500 }}
                            />
                            <YAxis
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                                tick={{ fill: '#64748b', fontWeight: 500 }}
                            />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#f1f5f9',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#0f172a'
                                }}
                                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={4}
                                dot={{ fill: '#ffffff', stroke: 'hsl(var(--primary))', strokeWidth: 3, r: 5 }}
                                activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                                animationDuration={1500}
                                fillOpacity={1}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
