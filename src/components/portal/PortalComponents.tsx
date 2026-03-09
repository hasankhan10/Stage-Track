'use client'

import React from 'react'
import Image from 'next/image'
import { Printer, ArrowRight, Building2, Shield, CheckCircle2, FileCheck, Clock, Currency } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import { format } from 'date-fns'

/* ─────────────────────────────────────────────────────────────────────────────
   PORTAL HEADER
   ────────────────────────────────────────────────────────────────────────── */

interface PortalHeaderProps {
    status: string
    isSigning: boolean
    onAccept: () => void
    brandName?: string
}

export const PortalHeader = React.memo(({ status, isSigning, onAccept, brandName = "Stova Media" }: PortalHeaderProps) => {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all">
            <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 relative flex items-center justify-center">
                        <Image src="/logo.jpg" alt={`${brandName} logo`} fill className="object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">{brandName} <span className="text-primary">Portal</span></span>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200/60 text-slate-600 hover:bg-slate-50 gap-2 focus:outline-none" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print / PDF
                    </Button>
                    {status !== 'accepted' && (
                        <Button size="lg" className="rounded-full px-8 shadow-xl hover:shadow-primary/20 transition-transform active:scale-95 font-bold" onClick={onAccept} disabled={isSigning}>
                            {isSigning ? 'Processing...' : 'Sign & Accept'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
})

PortalHeader.displayName = 'PortalHeader'

/* ─────────────────────────────────────────────────────────────────────────────
   PROPOSAL HERO
   ────────────────────────────────────────────────────────────────────────── */

interface ProposalHeroProps {
    title: string
    clientName: string
    totalValue: number
    createdAt: string
}

export const ProposalHero = React.memo(({ title, clientName, totalValue, createdAt }: ProposalHeroProps) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20 animate-in slide-in-from-top-4 duration-700">
            <div className="flex-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                    Official Business Proposal
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-[1.15] mb-4">
                    {title}
                </h1>
                <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                    Prepared for <span className="text-slate-900 font-bold">{clientName}</span> to accelerate growth and operational efficiency.
                </p>
            </div>

            <div className="flex flex-col items-end text-sm">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Proposal Total</div>
                <div className="text-4xl font-black text-primary font-mono tracking-tighter">
                    {formatCurrency(totalValue)}
                </div>
                <div className="mt-6 flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
                    <Clock className="h-4 w-4 text-primary/60" />
                    <span className="font-semibold">Issued {format(new Date(createdAt), 'MMMM do, yyyy')}</span>
                </div>
            </div>
        </div>
    )
})

ProposalHero.displayName = 'ProposalHero'

/* ─────────────────────────────────────────────────────────────────────────────
   PROPOSAL DETAILS
   ────────────────────────────────────────────────────────────────────────── */

interface ProposalDetailsProps {
    clients: any
    body: string
}

export const ProposalDetails = React.memo(({ clients, body }: ProposalDetailsProps) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24 anim-delay-200 animate-in fade-in duration-1000">
                <div>
                    <h3 className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px] mb-8 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary/40" />
                        Account Details
                    </h3>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Client Contact</span>
                            <span className="text-lg font-bold text-slate-800">{clients.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Company / Entity</span>
                            <span className="text-lg font-bold text-slate-800">{clients.company || 'Private Entity'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                            <span className="text-lg font-bold text-primary hover:underline cursor-pointer transition-all">{clients.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px] mb-8 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500/40" />
                        Verified Agreement
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                <strong className="text-slate-900">Scope of Work:</strong> All services outlined in this proposal are guaranteed for delivery within the agreed timeframe.
                            </p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                <strong className="text-slate-900">Digital Acceptance:</strong> Signing via this secure portal constitutes a legally binding agreement between both parties.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="prose prose-slate max-w-none mb-24 anim-delay-400 animate-in fade-in duration-1000">
                <h3 className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px] mb-8 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary/40" />
                    Scope & Strategic Initiative
                </h3>
                <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-medium bg-slate-50/30 p-8 rounded-2xl border border-slate-100">
                    {body || 'No detailed scope provided.'}
                </div>
            </div>
        </>
    )
})

ProposalDetails.displayName = 'ProposalDetails'

/* ─────────────────────────────────────────────────────────────────────────────
   PORTAL FOOTER
   ────────────────────────────────────────────────────────────────────────── */

interface PortalFooterProps {
    status: string
    isSigning: boolean
    onAccept: () => void
}

export const PortalFooter = React.memo(({ status, isSigning, onAccept }: PortalFooterProps) => {
    return (
        <>
            <div className="mt-32 p-12 bg-[#0F172A] rounded-[2.5rem] text-white flex flex-col items-center text-center shadow-2xl shadow-slate-900/40 overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none" />

                {status === 'accepted' ? (
                    <div className="animate-in zoom-in duration-500 relative z-10">
                        <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)] border-4 border-emerald-400/20">
                            <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-3">Proposal Signed & Secured</h2>
                        <p className="text-slate-400 font-medium text-lg">Digitally verified on {format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                ) : (
                    <div className="max-w-lg relative z-10">
                        <h2 className="text-3xl font-black mb-5">Ready to scale your business?</h2>
                        <p className="text-slate-400 mb-10 text-lg leading-relaxed font-medium">By accepting this proposal, you confirm the budget and strategic scope outlined above. Our team will begin the onboarding process within 24 hours.</p>
                        <Button size="lg" className="w-full h-16 rounded-full text-xl font-bold shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-300" onClick={onAccept} disabled={isSigning}>
                            {isSigning ? 'Processing Secure Signature...' : 'Securely Accept & Sign'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-10 opacity-30 grayscale pointer-events-none">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                    <Currency className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Stripe Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Legally Binding</span>
                </div>
            </div>
        </>
    )
})

PortalFooter.displayName = 'PortalFooter'
