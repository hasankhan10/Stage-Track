// ─── Shared Client Types ─────────────────────────────────────────────────────

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

export interface Stats {
    totalValue: number
    totalClients: number
    activeClients: number
}

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
    new: { label: 'New', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    replied: { label: 'Replied', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    meeting_scheduled: { label: 'Meeting Set', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    qualified: { label: 'Qualified ✓', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    proposal_sent: { label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    negotiating: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    won: { label: 'Won 🎉', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    lost: { label: 'Lost', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
}

export const GROUP_COLORS: Record<string, string> = {
    Lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Prospect: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Client: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function getStatus(val: string | null) {
    return STATUS_MAP[val ?? 'new'] ?? STATUS_MAP.new
}

export type SortKey = 'updated_at' | 'created_at' | 'name' | 'deal_value' | 'stage'

export const SORT_OPTIONS: { label: string; value: SortKey }[] = [
    { label: 'Last Updated', value: 'updated_at' },
    { label: 'Date Added', value: 'created_at' },
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Deal Value', value: 'deal_value' },
    { label: 'Stage', value: 'stage' },
]
