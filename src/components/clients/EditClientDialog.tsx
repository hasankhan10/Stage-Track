'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Edit2, Loader2, IndianRupee, Globe, Mail, Phone, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditClientDialogProps {
    client: any
}

export function EditClientDialog({ client }: EditClientDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [form, setForm] = useState({
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        website: client.website || '',
        deal_value: client.deal_value?.toString() || '0',
    })

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Client name is required')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    name: form.name.trim(),
                    company: form.company.trim() || null,
                    email: form.email.trim() || null,
                    phone: form.phone.trim() || null,
                    website: form.website.trim() || null,
                    deal_value: Math.round(parseFloat(form.deal_value) || 0),
                    updated_at: new Date().toISOString()
                })
                .eq('id', client.id)

            if (error) throw error

            toast.success('Client details updated')
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error('Failed to update client: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-2">
                        <Edit2 className="h-4 w-4" />
                        Edit Details
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Client Details</DialogTitle>
                    <DialogDescription>
                        Update the information for <strong>{client.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Rahul Sharma"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="rahul@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> Phone
                            </Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="h-3 w-3" /> Company
                            </Label>
                            <Input
                                id="company"
                                value={form.company}
                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                placeholder="Infosys Ltd."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deal_value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <IndianRupee className="h-3 w-3" /> Deal Value (₹)
                            </Label>
                            <Input
                                id="deal_value"
                                type="number"
                                value={form.deal_value}
                                onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))}
                                placeholder="50000"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Globe className="h-3 w-3" /> Website
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                value={form.website}
                                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                placeholder="https://infosys.com"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
