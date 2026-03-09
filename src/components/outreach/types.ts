export type Channel = 'Email' | 'LinkedIn' | 'Call' | 'Meeting' | 'Other'
export type OutreachStatus =
    | 'Sent' | 'Replied' | 'Bounced' | 'Meeting Set'
    | 'No Answer' | 'Interested' | 'Not Interested'

export interface OutreachLog {
    id: string
    client_id: string
    channel: Channel
    status: OutreachStatus
    notes: string | null
    contacted_at: string
    clients: { id: string; name: string; company: string | null } | null
}

export const CHANNELS: Channel[] = ['Email', 'LinkedIn', 'Call', 'Meeting', 'Other']

export const ALL_STATUSES: OutreachStatus[] = [
    'Sent', 'Replied', 'Bounced', 'Meeting Set',
    'No Answer', 'Interested', 'Not Interested',
]
