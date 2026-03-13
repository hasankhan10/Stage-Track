import { Skeleton } from "@/components/ui/skeleton"

export default function PipelineStageLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>

            {/* Content Area Skeleton */}
            <div className="grid gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between w-full">
                        <Skeleton className="h-10 w-48 rounded-md" />
                        <Skeleton className="h-10 w-32 rounded-full" />
                    </div>
                    
                    <div className="rounded-xl border border-border/50 bg-card overflow-hidden h-[600px] p-6 space-y-4">
                        <div className="flex gap-4 border-b pb-4">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="space-y-4 pt-4">
                             <Skeleton className="h-20 w-full rounded-xl" />
                             <Skeleton className="h-20 w-full rounded-xl" />
                             <Skeleton className="h-20 w-full rounded-xl" />
                             <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
