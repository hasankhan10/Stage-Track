import { KPICards } from '@/components/analytics/KPICards'
import { PipelineValueChart } from '@/components/analytics/PipelineValueChart'
import { RevenueLineChart } from '@/components/analytics/RevenueLineChart'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'

export default function AnalyticsPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics & Insights</h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        Performance overview and revenue insights for your workspace.
                    </p>
                </div>
            </div>

            <KPICards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PipelineValueChart />
                <ConversionFunnel />
            </div>

            <div className="grid grid-cols-1 gap-8">
                <RevenueLineChart />
            </div>
        </div>
    )
}
