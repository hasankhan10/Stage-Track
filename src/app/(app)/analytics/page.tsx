import { KPICards } from '@/components/analytics/KPICards'
import { PipelineValueChart } from '@/components/analytics/PipelineValueChart'
import { RevenueLineChart } from '@/components/analytics/RevenueLineChart'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'

export default function AnalyticsPage() {
    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground mt-1">
                    Performance overview and revenue insights for your workspace.
                </p>
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
