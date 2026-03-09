'use client'

import { memo } from 'react'
import {
    FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from 'lucide-react'

interface InvoiceDetailsCardProps {
    form: any
    clients: { id: string; name: string }[]
}

export const InvoiceDetailsCard = memo(function InvoiceDetailsCard({ form, clients }: InvoiceDetailsCardProps) {
    return (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Receipt className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Invoice Intelligence</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Target Client</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 bg-background focus:ring-2 focus:ring-primary/20 transition-all font-bold rounded-xl border-border/60">
                                            <SelectValue placeholder="Select target client">
                                                {clients.find(c => c.id === field.value)?.name}
                                            </SelectValue>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl shadow-premium border-border/40">
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-xl font-medium focus:bg-primary/5">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="invoice_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Invoice ID</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        className="h-12 bg-background focus:ring-2 focus:ring-primary/20 transition-all font-mono font-black rounded-xl border-border/60 uppercase tracking-tighter"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Maturity Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        className="h-12 bg-background focus:ring-2 focus:ring-primary/20 transition-all font-bold rounded-xl border-border/60"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    )
})
