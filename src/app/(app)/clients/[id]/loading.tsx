import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export default function ClientProfileSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border/50 shadow-premium relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                    <Skeleton className="h-24 w-24 rounded-2xl shadow-xl" />
                    <div className="flex flex-col items-center md:items-start space-y-3">
                        <Skeleton className="h-10 w-64" />
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-32 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <Skeleton className="h-11 w-32 rounded-full" />
                    <Skeleton className="h-11 w-40 rounded-full" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="bg-background rounded-lg border shadow-sm p-4 h-[calc(100vh-16rem)] overflow-hidden">
                <div className="flex gap-4 border-b pb-4 mb-4">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
