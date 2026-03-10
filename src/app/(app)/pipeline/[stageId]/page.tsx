import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { StageDetailClient } from '@/components/pipeline/StageDetailClient'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    params: Promise<{ stageId: string }>
}

export async function generateMetadata({ params }: Props) {
    const { stageId } = await params
    const stage = PIPELINE_STAGES.find(s => s.id === parseInt(stageId))
    return {
        title: stage ? `${stage.name} | Pipeline | Stova Media` : 'Pipeline Stage | Stova Media',
    }
}

export default async function StageDetailPage({ params }: Props) {
    const { stageId } = await params
    const id = parseInt(stageId)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    const stage = PIPELINE_STAGES.find(s => s.id === id)
    if (!stage) return notFound()

    const prevStage = PIPELINE_STAGES.find(s => s.id === id - 1)
    const nextStage = PIPELINE_STAGES.find(s => s.id === id + 1)

    const groupBadgeColors: Record<string, string> = {
        'Lead': 'bg-blue-100 text-blue-700',
        'Prospect': 'bg-orange-100 text-orange-700',
        'Client': 'bg-emerald-100 text-emerald-700',
        'Archived': 'bg-slate-100 text-slate-600',
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb + Stage Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/pipeline" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        Pipeline
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${groupBadgeColors[stage.statusGroup]}`}>
                        {stage.statusGroup}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{stage.name}</span>
                </div>

                {/* Stage Navigation */}
                <div className="flex items-center gap-2">
                    {prevStage && (
                        <Link
                            href={`/pipeline/${prevStage.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                            <ChevronLeft className="h-3 w-3" />
                            {prevStage.name}
                        </Link>
                    )}
                    {nextStage && (
                        <Link
                            href={`/pipeline/${nextStage.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1.5 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                            {nextStage.name}
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <StageDetailClient stageId={id} isAdmin={isAdmin} />
        </div>
    )
}
