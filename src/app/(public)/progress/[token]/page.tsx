import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { Check, Clock, CircleDot } from 'lucide-react'

export const metadata = {
    title: 'Project Progress Dashboard',
}

export default async function ProgressPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const supabase = await createClient()

    // 1. Resolve token to get client data securely
    // We bypass RLS using the service role for lookup if needed, 
    // but if RLS on client_links allows anonymous read by token, standard client works.
    const { data: link, error: linkError } = await supabase
        .from('client_links')
        .select('client_id')
        .eq('token', token)
        .single()

    if (linkError || !link) {
        return notFound()
    }

    // 2. Fetch Client Info
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name, stage, updated_at')
        .eq('id', link.client_id)
        .single()

    if (clientError || !client) {
        return notFound()
    }

    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === client.stage)

    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Progress</h1>
                    <p className="text-muted-foreground text-lg">
                        Dashboard for <span className="font-semibold text-foreground">{client.name}</span>
                    </p>
                </div>

                {/* Timeline Visualization */}
                <div className="bg-background rounded-xl border p-8 shadow-sm">
                    <h3 className="text-xl font-semibold mb-8">Timeline</h3>

                    <div className="relative border-l border-muted pl-6 ml-4 space-y-8">
                        {PIPELINE_STAGES.map((stage, index) => {
                            const isActive = index === currentStageIndex
                            const isPast = index < currentStageIndex

                            return (
                                <div key={stage.id} className="relative">
                                    {/* Timeline Node */}
                                    <span className={`absolute -left-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background 
                    ${isActive ? 'border-primary text-primary' :
                                            isPast ? 'border-primary bg-primary text-primary-foreground' :
                                                'border-muted text-muted-foreground'}`
                                    }>
                                        {isPast ? <Check className="h-4 w-4" /> :
                                            isActive ? <CircleDot className="h-4 w-4 animate-pulse" /> :
                                                <Clock className="h-4 w-4 opacity-50" />}
                                    </span>

                                    <div className={`flex flex-col gap-1 ${!isActive && !isPast && 'opacity-50'}`}>
                                        <h4 className={`text-lg font-semibold ${isActive && 'text-primary'}`}>
                                            {stage.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {stage.description}
                                        </p>

                                        {isActive && (
                                            <div className="text-xs text-muted-foreground mt-2 font-medium bg-muted w-max px-2 py-1 rounded inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Last updated {new Date(client.updated_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    )
}
