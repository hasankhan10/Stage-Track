export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount) // deal_value is stored as whole rupees
}

export function calculateDaysInStage(updatedAt: string): number {
    const updatedDate = new Date(updatedAt)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - updatedDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
