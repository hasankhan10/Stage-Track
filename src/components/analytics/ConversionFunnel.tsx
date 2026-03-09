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
        <Card className="col-span-1 shadow-2xl shadow-slate-200/40 border border-slate-100 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100/50 bg-white/40 pb-4">
                <CardTitle className="text-lg font-black text-slate-800">Lead Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                                fontSize={13}
                                tick={{ fill: '#475569', fontWeight: 600 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
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
                            />
                            <Bar
                                dataKey="count"
                                fill="hsl(var(--primary))"
                                radius={[0, 6, 6, 0]}
                                barSize={36}
                            >
                                <LabelList
                                    dataKey="conversion"
                                    position="right"
                                    style={{ fill: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                                    offset={12}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
