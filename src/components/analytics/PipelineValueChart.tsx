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
    Cell
} from 'recharts'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PipelineValueChart() {
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true)
                const { data: clients, error } = await supabase
                    .from('clients')
                    .select('deal_value, stage')

                if (error) throw error

                // Group by stage
                const groupedData = PIPELINE_STAGES.map(stage => {
                    const stageClients = clients?.filter(c => c.stage === stage.id) || []
                    const totalValue = stageClients.reduce((sum, c) => sum + (c.deal_value || 0), 0)
                    return {
                        name: stage.name,
                        value: totalValue,
                        count: stageClients.length,
                        color: stage.color // Assuming stage.color exists in lib/pipeline
                    }
                }).filter(s => s.value > 0 || s.count > 0)

                setData(groupedData)
            } catch (error) {
                console.error('Error fetching chart data:', error)
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
                <CardTitle className="text-lg font-black text-slate-800">Pipeline Value by Stage</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tick={{ fill: 'currentColor', opacity: 0.6 }}
                            />
                            <YAxis
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${value}`}
                                tick={{ fill: '#64748b', fontWeight: 500 }}
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
                                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total Value']}
                            />
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} opacity={0.8 + (index * 0.05)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
