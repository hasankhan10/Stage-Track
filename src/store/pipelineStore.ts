import { create } from 'zustand'

export interface ClientData {
    id: string
    name: string
    company: string | null
    deal_value: number
    stage: number
    assigned_to: string | null
    assigned_user?: {
        name: string
        email: string
    }
    created_at: string
    updated_at: string
    // For UI calculated values
    daysInStage: number
}

interface PipelineState {
    clients: ClientData[]
    isLoading: boolean
    searchQuery: string
    filterGroup: string | null
    filterUser: string | null
    setClients: (clients: ClientData[]) => void
    addClient: (client: ClientData) => void
    updateClientStage: (clientId: string, newStage: number) => void
    setSearchQuery: (query: string) => void
    setFilterGroup: (group: string | null) => void
    setFilterUser: (userId: string | null) => void
    setIsLoading: (isLoading: boolean) => void
}

export const usePipelineStore = create<PipelineState>((set) => ({
    clients: [],
    isLoading: true,
    searchQuery: '',
    filterGroup: null,
    filterUser: null,
    setClients: (clients) => set({ clients, isLoading: false }),
    addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
    updateClientStage: (clientId, newStage) =>
        set((state) => ({
            clients: state.clients.map((c) =>
                c.id === clientId ? { ...c, stage: newStage } : c
            )
        })),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterGroup: (filterGroup) => set({ filterGroup }),
    setFilterUser: (filterUser) => set({ filterUser }),
    setIsLoading: (isLoading) => set({ isLoading }),
}))
