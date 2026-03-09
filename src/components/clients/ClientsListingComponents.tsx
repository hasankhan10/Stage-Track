'use client'

import React from 'react'
import { Plus, Search, Filter, ChevronDown, ListFilter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

/* ─────────────────────────────────────────────────────────────────────────────
   CLIENTS LISTING HEADER
   ────────────────────────────────────────────────────────────────────────── */

interface ClientsListingHeaderProps {
    totalClients: number
    onNewClient: () => void
}

export const ClientsListingHeader = React.memo(({ totalClients, onNewClient }: ClientsListingHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[1rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Plus className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight tracking-[-0.03em] text-slate-900">Account Portfolio</h1>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                    Omni-Channel Synchronization <span className="h-1 w-1 rounded-full bg-primary/40" /> {totalClients} Registered Entities
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    onClick={onNewClient}
                    className="h-11 rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Initiate Acquisition
                </Button>
            </div>
        </div>
    )
})

ClientsListingHeader.displayName = 'ClientsListingHeader'

/* ─────────────────────────────────────────────────────────────────────────────
   CLIENTS LISTING FILTERS
   ────────────────────────────────────────────────────────────────────────── */

interface ClientsListingFiltersProps {
    searchQuery: string
    setSearchQuery: (val: string) => void
    statusFilter: string
    setStatusFilter: (val: string) => void
    sortOrder: string
    setSortOrder: (val: string) => void
}

export const ClientsListingFilters = React.memo(({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder
}: ClientsListingFiltersProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 backdrop-blur-xl p-4 rounded-[1.5rem] border border-border/40 shadow-premium shadow-slate-100/50">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                <Input
                    placeholder="Search accounts, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-11 bg-background border-border/50 focus:ring-2 focus:ring-primary/10 rounded-2xl font-bold text-sm transition-all shadow-sm w-full"
                />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" className="h-11 rounded-2xl px-5 border-border/50 bg-background font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex gap-3">
                                <ListFilter className="h-3.5 w-3.5 text-primary" />
                                {statusFilter === 'all' ? 'Status: Global' : `Status: ${statusFilter}`}
                                <ChevronDown className="h-3 w-3 opacity-40 ml-1" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-premium border-border/40 p-1.5">
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setStatusFilter('all')}>View All Portfolios</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setStatusFilter('Lead')}>Lead Acquisition</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setStatusFilter('Proposal')}>Draft Proposal</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setStatusFilter('Negotiation')}>Strategy Review</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setStatusFilter('Closed')}>Closed Operations</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" className="h-11 rounded-2xl px-5 border-border/50 bg-background font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex gap-3">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-500" />
                                {sortOrder === 'newest' ? 'Order: Recency' : sortOrder === 'oldest' ? 'Order: Archival' : sortOrder === 'value' ? 'Order: Valuation' : 'Order: Alphabetical'}
                                <ChevronDown className="h-3 w-3 opacity-40 ml-1" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-premium border-border/40 p-1.5">
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setSortOrder('newest')}>Newest Interactions</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setSortOrder('oldest')}>Historical Data</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setSortOrder('value')}>High Valuation Priority</DropdownMenuItem>
                        <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer font-bold text-xs" onClick={() => setSortOrder('name')}>A-Z Registry</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})

ClientsListingFilters.displayName = 'ClientsListingFilters'
