'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ConversionFunnel() {
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true)
                const { data: clients } = await supabase
                    .from('clients')
                    .select('stage')

                // Simplified funnel stages:
                // Lead (Stage 1) -> Qualified (Stage 3) -> Proposal (Stage 5) -> Contract (Stage 8) -> Won (Stage 11)
                const funnelStages = [
                    { name: 'Leads', id: 1 },
                    { name: 'Qualified', id: 3 },
                    { name: 'Proposal', id: 5 },
                    { name: 'Contract', id: 8 },
                    { name: 'Won', id: 11 }
                ]

                const chartData = funnelStages.map((stage, index) => {
                    // Count clients who reached at least this stage
                    const count = clients?.filter(c => c.stage >= stage.id).length || 0
                    const prevCount = index > 0 ? (clients?.filter(c => c.stage >= funnelStages[index - 1].id).length || 0) : count
                    const conversion = index > 0 && prevCount > 0 ? Math.round((count / prevCount) * 100) : 100

                    return {
                        name: stage.name,
                        count,
                        conversion: `${conversion}%`
                    }
                })

                setData(chartData)
            } catch (error) {
                console.error('Error fetching funnel data:', error)
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
                <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 5, right: 80, left: 40, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                fontSize={12}
                                tick={{ fill: 'currentColor', opacity: 0.8 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="hsl(var(--primary))"
                                radius={[0, 4, 4, 0]}
                                barSize={32}
                            >
                                <LabelList
                                    dataKey="conversion"
                                    position="right"
                                    style={{ fill: 'currentColor', fontSize: '10px', opacity: 0.6 }}
                                    offset={10}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
