'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
    Plus,
    Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import { AddClientDialog } from './AddClientDialog'
import { ClientRow } from './ClientRow'
import { ClientsListingHeader, ClientsListingFilters } from './ClientsListingComponents'

interface Client {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    website: string | null
    stage: string
    deal_value: number | null
    updated_at: string
}

export function ClientsListing({ initialClients }: { initialClients: Client[] }) {
    const [clients, setClients] = useState<Client[]>(initialClients)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortOrder, setSortOrder] = useState('newest')
    const [isAddOpen, setIsAddOpen] = useState(false)

    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to decommission this account? All associated log data will be archived.')) return

        try {
            const { error } = await supabase.from('clients').delete().eq('id', id)
            if (error) throw error
            setClients(prev => prev.filter(c => c.id !== id))
            toast.success('Account decommissioned successfully')
        } catch (error: any) {
            toast.error(error.message || 'Decommission failed')
        }
    }, [supabase])

    const filteredClients = useMemo(() => {
        return clients
            .filter(c => {
                const matchesSearch =
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                    (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)

                const matchesStatus = statusFilter === 'all' || c.stage === statusFilter

                return matchesSearch && matchesStatus
            })
            .sort((a, b) => {
                if (sortOrder === 'newest') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                if (sortOrder === 'oldest') return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
                if (sortOrder === 'value') return (b.deal_value || 0) - (a.deal_value || 0)
                if (sortOrder === 'name') return a.name.localeCompare(b.name)
                return 0
            })
    }, [clients, searchQuery, statusFilter, sortOrder])

    return (
        <div className="max-w-7xl mx-auto space-y-12 py-10 animate-in fade-in duration-1000">
            {/* Header Section */}
            <ClientsListingHeader
                totalClients={clients.length}
                onNewClient={() => setIsAddOpen(true)}
            />

            {/* Filters Section */}
            <ClientsListingFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />

            {/* Content Section */}
            <Card className="border-none shadow-premium bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/20">
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Entity Identity</th>
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Execution Channels</th>
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Pipeline Tier</th>
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Strategic Valor</th>
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Last Comm Sync</th>
                                    <th className="py-5 px-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Dossier Access</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => (
                                        <ClientRow key={client.id} client={client} onDelete={handleDelete} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center bg-muted/5 animate-in fade-in duration-1000">
                                            <div className="max-w-sm mx-auto space-y-6">
                                                <div className="h-20 w-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/20 shadow-xl shadow-primary/5">
                                                    <Users className="h-10 w-10 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight tracking-[-0.02em]">Zero Protocols Identified</h3>
                                                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                                                        No account profiles match your current search criteria. Refine your query or synchronize your registry.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="rounded-full font-black px-8 border-border/60"
                                                    onClick={() => {
                                                        setSearchQuery('')
                                                        setStatusFilter('all')
                                                    }}
                                                >
                                                    Global Registry Access
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AddClientDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSuccess={(newClient: any) => {
                    setClients(prev => [newClient, ...prev])
                    toast.success('Account Protocol Initialized')
                }}
            />
        </div>
    )
}
