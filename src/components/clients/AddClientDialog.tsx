'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, Mail, Phone, Building2, Globe, IndianRupee } from 'lucide-react'

interface AddClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (client: any) => void
}

export const AddClientDialog = ({ open, onOpenChange, onSuccess }: AddClientDialogProps) => {
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        website: '',
        deal_value: '0'
    })

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Client name is required')
            return
        }

        setSubmitting(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('clients')
                .insert({
                    name: form.name.trim(),
                    company: form.company.trim() || null,
                    email: form.email.trim() || null,
                    phone: form.phone.trim() || null,
                    website: form.website.trim() || null,
                    deal_value: parseInt(form.deal_value) || 0,
                    user_id: userData.user.id,
                    stage: 1 // Default to Lead stage
                })
                .select()
                .single()

            if (error) throw error

            toast.success('Account Protocol Initialized', {
                description: `${form.name} has been added to the registry.`
            })

            setForm({
                name: '',
                company: '',
                email: '',
                phone: '',
                website: '',
                deal_value: '0'
            })
            onSuccess?.(data)
            onOpenChange(false)
        } catch (error: any) {
            toast.error('Protocol Error', {
                description: error.message || 'Failed to initialize client acquisition.'
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-[1.5rem] border-border/40 overflow-hidden bg-white/95 backdrop-blur-xl shadow-premium">
                <DialogHeader className="p-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Plus className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Acquisition Protocol</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest pl-1">
                        Register a new entity into the primary synchronization network.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-5 px-1">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Entity Primary Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Alexander Pierce"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Communication Vector
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@domain.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Digital Reach
                            </Label>
                            <Input
                                id="phone"
                                placeholder="+91 XXXX XXXX"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Corporate Entity
                            </Label>
                            <Input
                                id="company"
                                placeholder="Enterprise Name"
                                value={form.company}
                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deal_value" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                <IndianRupee className="h-3 w-3" /> Projected Valuation
                            </Label>
                            <Input
                                id="deal_value"
                                type="number"
                                placeholder="0"
                                value={form.deal_value}
                                onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
                                <Globe className="h-3 w-3" /> Digital Domain
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://domain.com"
                                value={form.website}
                                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-8 pt-6 border-t border-slate-100 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full font-black text-[11px] uppercase tracking-widest px-6 h-11"
                        >
                            Abort Acquisition
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-8 h-11 shadow-xl shadow-slate-200"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white/50" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Confirm Entity
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
