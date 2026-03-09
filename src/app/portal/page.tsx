'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { PortalHeader, ProposalHero, ProposalDetails, PortalFooter } from '@/components/portal/PortalComponents'

function PortalContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const [proposal, setProposal] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSigning, setIsSigning] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }

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

    const handleAccept = useCallback(async () => {
        if (!proposal) return
        setIsSigning(true)
        try {
            const { error } = await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('id', proposal.id)

            if (error) throw error

            setProposal((prev: any) => ({ ...prev, status: 'accepted' }))
            toast.success('Proposal Digitally Signed!', {
                description: 'You will receive a confirmation email shortly.'
            })
        } catch (err) {
            toast.error('Failed to sign proposal')
        } finally {
            setIsSigning(false)
        }
    }, [proposal, supabase])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-14 w-14 border-[5px] border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">Establishing Secure Connection...</p>
                </div>
            </div>
        )
    }

    if (!proposal) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center px-6 selection:bg-primary/10">
                <div className="max-w-md text-center animate-in zoom-in duration-700">
                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
                        <Shield className="h-10 w-10 text-slate-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Invalid Link</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">This proposal link is no longer active or has been revoked. Please contact your account manager for a secure update.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 selection:bg-primary/10 font-sans">
            <PortalHeader
                brandName="Stova Media"
                status={proposal.status}
                isSigning={isSigning}
                onAccept={handleAccept}
            />

            <main className="max-w-5xl mx-auto px-6 pt-16">
                <div className="bg-white border border-slate-200/60 shadow-premium rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    {/* Visual Accent */}
                    <div className="h-2.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-indigo-600" />

                    <div className="p-10 md:p-20">
                        <ProposalHero
                            title={proposal.title}
                            clientName={proposal.clients.name}
                            totalValue={proposal.total_value}
                            createdAt={proposal.created_at}
                        />

                        {/* Divider */}
                        <div className="h-px w-full bg-slate-100 mb-20" />

                        <ProposalDetails
                            clients={proposal.clients}
                            body={proposal.line_items?.body}
                        />

                        <PortalFooter
                            status={proposal.status}
                            isSigning={isSigning}
                            onAccept={handleAccept}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function ProposalPortal() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-14 w-14 border-[5px] border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">Establishing Secure Connection...</p>
                </div>
            </div>
        }>
            <PortalContent />
        </Suspense>
    )
}
