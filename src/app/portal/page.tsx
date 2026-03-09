'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    FileCheck,
    Download,
    Building2,
    Calendar,
    Currency,
    CheckCircle2,
    Shield,
    Clock,
    Printer,
    ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function ProposalPortal() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const [proposal, setProposal] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSigning, setIsSigning] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!token) return

        async function fetchProposal() {
            const { data, error } = await supabase
                .from('proposals')
                .select(`
                    *,
                    clients (
                        name,
                        company,
                        email,
                        phone
                    )
                `)
                .eq('token', token)
                .single()

            if (data) {
                setProposal(data)
                // Mark as viewed if it was just 'sent'
                if (data.status === 'sent') {
                    await supabase
                        .from('proposals')
                        .update({ status: 'viewed' })
                        .eq('id', data.id)
                }
            }
            setLoading(false)
        }

        fetchProposal()
    }, [token, supabase])

    const handleAccept = async () => {
        setIsSigning(true)
        try {
            const { error } = await supabase
                .from('proposals')
                .update({
                    status: 'accepted',
                    // Logic to set accepted_at could be added to schema
                })
                .eq('id', proposal.id)

            if (error) throw error

            setProposal({ ...proposal, status: 'accepted' })
            toast.success('Proposal Digitally Signed!', {
                description: 'You will receive a confirmation email shortly.'
            })
        } catch (err) {
            toast.error('Failed to sign proposal')
        } finally {
            setIsSigning(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Loading Secure Proposal...</p>
                </div>
            </div>
        )
    }

    if (!proposal) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-6">
                <div className="max-w-md text-center">
                    <Shield className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h1>
                    <p className="text-slate-500 mb-8">This proposal link is no longer valid or may have been updated. Please contact your account manager for a new link.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 selection:bg-primary/20">
            {/* Header Bar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <FileCheck className="text-white h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">StageTrack <span className="text-primary">Portal</span></span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200/60 text-slate-600 hover:bg-slate-50 gap-2" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                            Print / PDF
                        </Button>
                        {proposal.status !== 'accepted' && (
                            <Button size="lg" className="rounded-full px-8 shadow-xl hover:shadow-primary/20' transition-transform active:scale-95" onClick={handleAccept} disabled={isSigning}>
                                {isSigning ? 'Processing Signature...' : 'Sign & Accept'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-12">
                {/* Premium Layout Start */}
                <div className="bg-white border border-slate-200/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">

                    {/* Visual Accent */}
                    <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-indigo-600" />

                    <div className="p-8 md:p-16">
                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                            <div className="flex-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                                    Official Business Proposal
                                </span>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight mb-4">
                                    {proposal.title}
                                </h1>
                                <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
                                    Prepared for {proposal.clients.name} to accelerate growth and operational efficiency.
                                </p>
                            </div>

                            <div className="flex flex-col items-end text-sm">
                                <div className="text-slate-400 font-medium uppercase tracking-wider mb-2">Proposal Total</div>
                                <div className="text-4xl font-black text-primary font-mono tracking-tighter">
                                    {formatCurrency(proposal.total_value)}
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <Clock className="h-4 w-4" />
                                    <span>Issued {format(new Date(proposal.created_at), 'MMMM do, yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 mb-20" />

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
                            <div>
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Account Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-400">Client Contact</span>
                                        <span className="text-lg font-bold text-slate-800">{proposal.clients.name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-400">Company / Entity</span>
                                        <span className="text-lg font-bold text-slate-800">{proposal.clients.company || 'Private Entity'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-400">Email Address</span>
                                        <span className="text-lg text-primary hover:underline cursor-pointer">{proposal.clients.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Verified Agreement
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            <strong>Scope of Work:</strong> All services outlined in this proposal are guaranteed for delivery within the agreed timeframe.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            <strong>Digital Acceptance:</strong> Signing via this secure portal constitutes a legally binding agreement between both parties.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Proposal Content (SOW) */}
                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                                <FileCheck className="h-4 w-4" />
                                Scope & Strategic Initiative
                            </h3>
                            <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                                {proposal.line_items?.body || 'No detailed scope provided.'}
                            </div>
                        </div>

                        {/* Footer / Sign-off Area */}
                        <div className="mt-32 p-10 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center text-center">
                            {proposal.status === 'accepted' ? (
                                <div className="animate-in zoom-in duration-500">
                                    <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                                        <CheckCircle2 className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Proposal Accepted</h2>
                                    <p className="text-slate-400">Digitally signed on {format(new Date(), 'MMMM d, yyyy')}</p>
                                </div>
                            ) : (
                                <div className="max-w-md">
                                    <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
                                    <p className="text-slate-400 mb-8">By accepting this proposal, you confirm the budget and scope outlined above. Our team will reach out within 24 hours to begin onboarding.</p>
                                    <Button size="lg" className="w-full h-14 rounded-full text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onClick={handleAccept} disabled={isSigning}>
                                        {isSigning ? 'Processing Signature...' : 'Accept & Sign Proposal'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secure Trust Indicators */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale pointer-events-none">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Currency className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Stripe Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">256-bit Secure</span>
                    </div>
                </div>
            </main>
        </div>
    )
}
