'use client'

import React from 'react'
import { Users, TrendingUp, IndianRupee } from 'lucide-react'
import { Stats } from './types'

interface ClientStatsProps {
    stats: Stats
}

export const ClientStats = React.memo(({ stats }: ClientStatsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{stats.totalClients}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total Clients</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.activeClients}</p>
                    <p className="text-xs text-muted-foreground font-medium">Active Clients</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-600">
                        ₹{stats.totalValue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">Total Pipeline Value</p>
                </div>
            </div>
        </div>
    )
})

ClientStats.displayName = 'ClientStats'
