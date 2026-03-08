export type StatusGroup = 'Lead' | 'Prospect' | 'Client' | 'Archived'

export interface PipelineStage {
    id: number
    name: string
    statusGroup: StatusGroup
    description: string
    color: string
}

export const PIPELINE_STAGES: PipelineStage[] = [
    { id: 1, name: 'Cold Outreach', statusGroup: 'Lead', description: 'First contact sent. Email / DM / LinkedIn / call logged.', color: '#3498DB' },
    { id: 2, name: 'Follow-Up', statusGroup: 'Lead', description: '2nd or 3rd touch. No reply yet. Follow-up reminder set.', color: '#3498DB' },
    { id: 3, name: 'Discovery Call', statusGroup: 'Prospect', description: 'First conversation scheduled or completed.', color: '#E67E22' },
    { id: 4, name: 'Proposal Sent', statusGroup: 'Prospect', description: 'Scope, pricing, timeline sent to client.', color: '#E67E22' },
    { id: 5, name: 'Negotiation', statusGroup: 'Prospect', description: 'Active back-and-forth on price, scope, or timeline.', color: '#E67E22' },
    { id: 6, name: 'Contract Signed', statusGroup: 'Client', description: 'Deal closed. Formal agreement confirmed.', color: '#27AE60' },
    { id: 7, name: 'Onboarding', statusGroup: 'Client', description: 'Kickoff done. Access shared. Onboarding checklist triggered.', color: '#27AE60' },
    { id: 8, name: 'In Progress', statusGroup: 'Client', description: 'Active project work. Milestones being tracked.', color: '#27AE60' },
    { id: 9, name: 'Review / Feedback', statusGroup: 'Client', description: 'Deliverable shared. Awaiting client response.', color: '#27AE60' },
    { id: 10, name: 'Delivered', statusGroup: 'Client', description: 'Final delivery confirmed. Invoice sent.', color: '#27AE60' },
    { id: 11, name: 'Retainer / Upsell', statusGroup: 'Client', description: 'Ongoing relationship or new project offered.', color: '#27AE60' },
    { id: 12, name: 'Churned / Lost', statusGroup: 'Archived', description: 'Deal lost or client ended relationship. Read-only record.', color: '#95A5A6' },
]

export function getStageById(id: number): PipelineStage | undefined {
    return PIPELINE_STAGES.find((s) => s.id === id)
}

export function getStageGroup(id: number): StatusGroup | undefined {
    return PIPELINE_STAGES.find((s) => s.id === id)?.statusGroup
}
