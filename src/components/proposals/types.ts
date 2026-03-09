import { Clock, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

export interface Proposal {
    id: string
    title: string
    client_id: string
    status: 'draft' | 'sent' | 'accepted' | 'declined' | 'viewed'
    total_value: number
    token: string
    created_at: string
    updated_at: string
    clients: {
        name: string
        company: string | null
    }
}

export const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Send },
    accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
    declined: { label: 'Declined', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', icon: AlertCircle },
    viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: ExternalLink },
} as const
