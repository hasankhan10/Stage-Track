import { Skeleton } from '@/components/ui/skeleton'

export function ClientCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded-full" />
            </div>
        </div>
    )
}

export function ClientListSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 border rounded-md p-4 bg-card">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    )
}

export function TaskListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded bg-card">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    )
}
