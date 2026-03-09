'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintInvoiceButton() {
    return (
        <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
    )
}
