'use client'

import { usePipelineStore } from '@/store/pipelineStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

export function BoardFilters() {
    const { searchQuery, setSearchQuery, filterGroup, setFilterGroup } = usePipelineStore()

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search clients or companies..."
                        className="w-full pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select
                    value={filterGroup || "all"}
                    onValueChange={(val) => setFilterGroup(val === "all" ? null : val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="Lead">Leads Only</SelectItem>
                        <SelectItem value="Prospect">Prospects Only</SelectItem>
                        <SelectItem value="Client">Clients Only</SelectItem>
                        <SelectItem value="Archived">Archived Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
