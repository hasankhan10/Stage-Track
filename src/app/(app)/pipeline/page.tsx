import { PipelineBoard } from '@/components/pipeline/PipelineBoard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Pipeline | StageTrack',
    description: 'Manage your client pipeline',
}

export default async function PipelinePage() {
    const supabase = await createClient()

    // Double check auth at the page level 
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Pipeline</h2>
                    <p className="text-muted-foreground">
                        Manage your leads, prospects, and active clients.
                    </p>
                </div>
            </div>

            <PipelineBoard />
        </div>
    )
}
