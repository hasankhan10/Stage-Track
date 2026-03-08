import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, FileSignature, XCircle } from 'lucide-react'

export const metadata = { title: 'Proposal Review' }

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const supabase = await createClient()

    // 1. Resolve token to get client_id
    const { data: link, error: linkError } = await supabase
        .from('client_links')
        .select('client_id')
        .eq('token', token)
        .single()

    if (linkError || !link) return notFound()

    // 2. Fetch the latest proposal for this client
    const { data: proposal, error: propError } = await supabase
        .from('proposals')
        .select('*, clients ( name, company )')
        .eq('client_id', link.client_id)
        .eq('status', 'Sent') // Only show Sent proposals
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (propError || !proposal) return (
        <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
            <Card className="max-w-md text-center py-12 px-6">
                <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Active Proposal</h2>
                <p className="text-muted-foreground text-sm">
                    There are currently no proposals pending your review here. If you accepted it previously, check your contract links or dashboard.
                </p>
            </Card>
        </div>
    )

    const isAccepted = proposal.status === 'Accepted'
    const isDeclined = proposal.status === 'Declined'

    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <FileSignature className="mx-auto h-16 w-16 text-primary" />
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">{proposal.title}</h1>
                    <p className="text-muted-foreground text-lg">
                        Prepared for <span className="font-semibold text-foreground">{proposal.clients?.name}</span>
                        {proposal.clients?.company ? ` at ${proposal.clients?.company}` : ''}
                    </p>
                </div>

                {/* Status Banners */}
                {isAccepted && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-3 border border-green-200">
                        <CheckCircle2 className="h-6 w-6" />
                        <div>
                            <p className="font-semibold">Proposal Accepted</p>
                            <p className="text-sm">Thank you for accepting! We will be in touch shortly with next steps.</p>
                        </div>
                    </div>
                )}
                {isDeclined && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-center gap-3 border border-red-200">
                        <XCircle className="h-6 w-6" />
                        <div>
                            <p className="font-semibold">Proposal Declined</p>
                            <p className="text-sm">You have declined this proposal. Please reach out if you have further questions.</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <Card className="shadow-lg border-primary/10">
                    <div className="p-8 md:p-12 space-y-8">
                        <div className="flex justify-between items-end border-b pb-6">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Investment Summary</p>
                                <p className="text-3xl font-bold mt-1 text-primary">{formatCurrency(proposal.deal_value / 100)}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                <p>Date: {new Date(proposal.created_at).toLocaleDateString()}</p>
                                <p>Valid for 30 days</p>
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none dark:prose-invert whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
                            {proposal.content}
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                {!isAccepted && !isDeclined && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <form action={`/api/proposals/${proposal.id}/decline`} method="POST">
                            <input type="hidden" name="token" value={token} />
                            <Button type="submit" variant="outline" size="lg" className="w-full sm:w-auto px-8">
                                Decline
                            </Button>
                        </form>
                        <form action={`/api/proposals/${proposal.id}/accept`} method="POST">
                            <input type="hidden" name="token" value={token} />
                            <Button type="submit" size="lg" className="w-full sm:w-auto px-12 bg-primary hover:bg-primary/90">
                                Accept & Sign
                            </Button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    )
}
