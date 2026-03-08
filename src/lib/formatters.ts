export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount / 100) // Amounts are stored in cents
}

export function calculateDaysInStage(updatedAt: string): number {
    const updatedDate = new Date(updatedAt)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - updatedDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
