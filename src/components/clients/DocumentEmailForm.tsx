'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileUp, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentEmailFormProps {
    clientId: string
    clientName: string
    type: 'Proposal' | 'Invoice'
}

export function DocumentEmailForm({ clientId, clientName, type }: DocumentEmailFormProps) {
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!file) {
            toast.error(`Please upload a ${type} PDF first.`)
            return
        }

        setSending(true)
        const formData = new FormData(e.currentTarget)
        formData.append('type', type)
        formData.append('file', file)

        try {
            const res = await fetch(`/api/clients/${clientId}/send-document`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to send email')
            }

            setSent(true)
            toast.success(`${type} sent successfully!`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSending(false)
        }
    }

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold">Email Sent!</h3>
                <p className="text-muted-foreground max-w-xs mt-2">
                    The {type.toLowerCase()} has been delivered to {clientName}.
                </p>
                <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                        setSent(false)
                        setFile(null)
                    }}
                >
                    Send Another
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                        id="subject" 
                        name="subject" 
                        placeholder={`${type} for ${clientName}`} 
                        required 
                        defaultValue={`${type} for ${clientName}`}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="body">Email Message</Label>
                    <Textarea 
                        id="body" 
                        name="body" 
                        placeholder={`Hi ${clientName.split(' ')[0]},\n\nPlease find attached the ${type.toLowerCase()} as discussed. Let me know if you have any questions.`}
                        className="min-h-[150px] resize-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Attach {type} (PDF)</Label>
                    <div className="relative group">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            required
                        />
                        <div className={`
                            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all
                            ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/50'}
                        `}>
                            <FileUp className={`h-8 w-8 mb-2 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-medium">
                                {file ? file.name : `Click to upload ${type.toLowerCase()} PDF`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF files only (Max 50MB)</p>
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-primary/20" disabled={sending}>
                {sending ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-5 w-5" />
                        Send {type}
                    </>
                )}
            </Button>
        </form>
    )
}
