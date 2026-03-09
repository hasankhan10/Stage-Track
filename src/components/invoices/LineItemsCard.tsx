'use client'

import React, { memo } from 'react'
import { useFieldArray } from 'react-hook-form'
import {
    FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface LineItemsCardProps {
    form: any
    subtotal: number
}

export const LineItemsCard = memo(function LineItemsCard({ form, subtotal }: LineItemsCardProps) {
    const { fields, append, remove } = useFieldArray({
        name: 'items',
        control: form.control,
    })

    return (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Ledger Items</CardTitle>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/40 hover:bg-primary/10 hover:text-primary transition-all font-bold px-4 h-9 shadow-sm"
                    onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Initiative
                </Button>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="group relative">
                            <div className="flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl border border-border/50 bg-background/50 relative hover:border-primary/30 hover:shadow-premium transition-all duration-300">
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -right-3 -top-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-destructive text-white hover:bg-destructive/90 shadow-lg transition-all scale-75 group-hover:scale-100"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                                    <div className="md:col-span-6">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Strategy / Service Description</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Describe the value addition..."
                                                            {...field}
                                                            className="h-12 bg-transparent border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 font-medium"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Units</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            {...field}
                                                            className="h-12 bg-transparent border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 font-black text-center"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Unit Investment (INR)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">₹</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                {...field}
                                                                className="h-12 pl-8 bg-transparent border-border/60 rounded-xl focus:ring-2 focus:ring-primary/20 font-black"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div className="mt-12 p-8 rounded-[2rem] bg-[#0F172A] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Audit</h4>
                            <p className="text-slate-500 text-xs font-medium">Auto-calculated based on {fields.length} line items.</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Consolidated Total</span>
                            <span className="text-4xl font-black font-mono tracking-tighter text-white">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})

LineItemsCard.displayName = 'LineItemsCard'
