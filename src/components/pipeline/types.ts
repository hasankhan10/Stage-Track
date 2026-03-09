export interface Client {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    website: string | null
    stage: number
    deal_value: number
    pipeline_status: string | null
    stage_notes: string | null
    updated_at: string
    created_at: string
}

export const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { value: 'replied', label: 'Replied', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    { value: 'meeting_scheduled', label: 'Meeting Set', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    { value: 'qualified', label: 'Qualified ✓', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    { value: 'won', label: 'Won 🎉', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    { value: 'lost', label: 'Lost', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
]

export function getStatusStyle(value: string) {
    return STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0]
}
