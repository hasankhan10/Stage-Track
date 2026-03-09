'use client'

import React from 'react'
import { Search, X, SlidersHorizontal, Filter, LayoutGrid, AlignJustify } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SORT_OPTIONS, GROUP_COLORS, type SortKey } from './types'
import { type PipelineStage } from '@/lib/pipeline'

interface ClientFiltersProps {
    search: string
    setSearch: (val: string) => void
    showFilters: boolean
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>
    activeFilterCount: number
    sortBy: SortKey
    setSortBy: (val: SortKey) => void
    view: 'grid' | 'list'
    setView: (val: 'grid' | 'list') => void
    groupFilter: string | null
    setGroupFilter: (val: string | null) => void
    stageFilter: number | null
    setStageFilter: (val: number | null) => void
    stages: PipelineStage[]
    clearFilters: () => void
    filteredCount: number
    totalCount: number
}

export const ClientFilters = React.memo(({
    search, setSearch,
    showFilters, setShowFilters,
    activeFilterCount,
    sortBy, setSortBy,
    view, setView,
    groupFilter, setGroupFilter,
    stageFilter, setStageFilter,
    stages,
    clearFilters,
    filteredCount,
    totalCount
}: ClientFiltersProps) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, company, email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-background focus:ring-2 focus:ring-primary/20 transition-shadow"
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
                    className={`gap-2 relative transition-all ${showFilters ? 'bg-primary/5 border-primary/30 z-10' : ''}`}
                    onClick={() => setShowFilters(v => !v)}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" size="sm" className="gap-2 focus:outline-none">
                                <Filter className="h-4 w-4" />
                                Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-44 shadow-premium">
                        {SORT_OPTIONS.map(opt => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => setSortBy(opt.value)}
                                className={sortBy === opt.value ? 'font-semibold text-primary bg-primary/5' : ''}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* View toggle */}
                <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                    <button
                        onClick={() => setView('grid')}
                        className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-background shadow-premium text-foreground scale-110 translate-y-[-1px]' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Grid view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-background shadow-premium text-foreground scale-110 translate-y-[-1px]' : 'text-muted-foreground hover:text-foreground'}`}
                        title="List view"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </button>
                </div>

                {/* Results count */}
                <span className="text-sm text-muted-foreground ml-auto whitespace-nowrap">
                    {filteredCount} of {totalCount} clients
                </span>
            </div>

            {/* Expanded filters */}
            {showFilters && (
                <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-muted/30 border border-border/50 animate-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Group:</span>
                    {['Lead', 'Prospect', 'Client', 'Archived'].map(g => (
                        <button
                            key={g}
                            onClick={() => setGroupFilter(groupFilter === g ? null : g)}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${groupFilter === g
                                ? GROUP_COLORS[g] + ' border-transparent shadow-premium scale-105'
                                : 'border-border bg-background hover:bg-muted/50 hover:border-muted'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                    <div className="w-px h-5 bg-border mx-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Stage:</span>
                    <select
                        value={stageFilter ?? ''}
                        onChange={e => setStageFilter(e.target.value ? Number(e.target.value) : null)}
                        className="text-xs font-medium border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer"
                    >
                        <option value="">All Stages</option>
                        {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors group"
                        >
                            <X className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" /> Clear all
                        </button>
                    )}
                </div>
            )}
        </div>
    )
})

ClientFilters.displayName = 'ClientFilters'
