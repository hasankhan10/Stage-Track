'use client'

import React from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CHANNELS, ALL_STATUSES } from './types'

interface OutreachFiltersProps {
    search: string
    setSearch: (val: string) => void
    channelFilter: string
    setChannelFilter: (val: string) => void
    statusFilter: string
    setStatusFilter: (val: string) => void
    showFilters: boolean
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>
    filteredCount: number
    totalCount: number
    activeFilters: number
    clearFilters: () => void
}

export const OutreachFilters = React.memo(({
    search,
    setSearch,
    channelFilter,
    setChannelFilter,
    statusFilter,
    setStatusFilter,
    showFilters,
    setShowFilters,
    filteredCount,
    totalCount,
    activeFilters,
    clearFilters,
}: OutreachFiltersProps) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search client, company, notes…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter toggle */}
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 relative"
                    onClick={() => setShowFilters(v => !v)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilters > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                            {activeFilters}
                        </span>
                    )}
                </Button>

                <span className="text-sm text-muted-foreground ml-auto">
                    {filteredCount} of {totalCount} entries
                </span>
            </div>

            {/* Expanded filters */}
            {showFilters && (
                <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel:</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {CHANNELS.map(ch => (
                                <button
                                    key={ch}
                                    onClick={() => setChannelFilter(channelFilter === ch ? '' : ch)}
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${channelFilter === ch
                                        ? 'bg-primary text-primary-foreground border-transparent'
                                        : 'border-border bg-background hover:bg-muted/50'
                                        }`}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-px h-5 bg-border" />

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">All Statuses</option>
                            {ALL_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {activeFilters > 0 && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" /> Clear all
                        </button>
                    )}
                </div>
            )}
        </div>
    )
})

OutreachFilters.displayName = 'OutreachFilters'
