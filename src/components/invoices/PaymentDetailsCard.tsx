'use client'

import { memo } from 'react'
import {
    FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Wallet } from 'lucide-react'

export const PaymentDetailsCard = memo(function PaymentDetailsCard({ form }: { form: any }) {
    return (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Payment Protocols</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="upi_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Preferred UPI Interface</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., yourname@upi"
                                        className="h-12 bg-background focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold rounded-xl border-border/60 lowercase"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bank_details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Wire Transfer Information</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={"Beneficiary Name:\nAccount Number:\nIFSC Protocol Code:"}
                                        className="min-h-[100px] bg-background focus:ring-2 focus:ring-primary/20 transition-all font-mono font-bold rounded-xl border-border/60 text-sm leading-relaxed p-4 whitespace-pre-wrap"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Execution Notes / Strategic Terms</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter strategic payment terms or a professional thank-you note..."
                                    className="min-h-[120px] bg-background focus:ring-2 focus:ring-primary/20 transition-all resize-none p-5 rounded-xl border-border/60 font-medium leading-relaxed"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    )
})

PaymentDetailsCard.displayName = 'PaymentDetailsCard'
