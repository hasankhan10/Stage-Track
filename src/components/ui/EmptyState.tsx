import { FileQuestion, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
    title: string
    description: string
    icon?: LucideIcon
    ctaLabel?: string
    ctaHref?: string
    ctaAction?: () => void
}

export function EmptyState({
    title,
    description,
    icon: Icon = FileQuestion,
    ctaLabel,
    ctaHref,
    ctaAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] bg-gradient-to-b from-muted/20 to-transparent border rounded-xl border-dashed border-muted-foreground/20 animate-in fade-in zoom-in duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-6 ring-1 ring-primary/20 shadow-inner">
                <Icon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                {title}
            </h3>
            <p className="text-base text-muted-foreground max-w-sm mb-8 leading-relaxed">
                {description}
            </p>

            <div className="flex gap-3">
                {ctaLabel && ctaHref && (
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                        <Link href={ctaHref}>
                            {ctaLabel}
                        </Link>
                    </Button>
                )}

                {ctaLabel && ctaAction && !ctaHref && (
                    <Button onClick={ctaAction} size="lg" className="shadow-lg shadow-primary/20">
                        {ctaLabel}
                    </Button>
                )}
            </div>
        </div>
    )
}
