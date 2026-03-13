import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Verify Authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Form Data
        const formData = await request.formData()
        const subject = formData.get('subject') as string
        const body = formData.get('body') as string
        const type = formData.get('type') as string // 'Proposal' or 'Invoice'
        const file = formData.get('file') as File | null

        if (!subject || !body || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 3. Fetch Client Info
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name, email')
            .eq('id', id)
            .single()

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        if (!client.email) {
            return NextResponse.json({ error: 'Client has no email address configured' }, { status: 400 })
        }

        // 4. Prepare Attachment
        const attachments = []
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer())
            attachments.push({
                filename: file.name,
                content: buffer,
            })
        }

        // 5. Send Email via Resend
        if (process.env.RESEND_API_KEY) {
            const emailResult = await resend.emails.send({
                from: `Stova Media <updates@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
                to: client.email,
                subject: subject,
                attachments: attachments,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #000;">Hello ${client.name},</h2>
                        <div style="line-height: 1.6; font-size: 16px; white-space: pre-wrap;">
                            ${body}
                        </div>
                        <p style="margin-top: 30px; border-top: 1px solid #eee; pt: 20px; font-size: 14px; color: #666;">
                            Sent via Stova Media CRM
                        </p>
                    </div>
                `
            })

            if (emailResult.error) {
                console.error('Resend Error:', emailResult.error)
                return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
            }
        } else {
            console.warn('RESEND_API_KEY missing - skipping real email send')
        }

        // 6. Log Activity
        await supabase.from('activity_log').insert({
            client_id: client.id,
            action_type: type.toLowerCase(),
            description: `${type} emailed to client: ${subject}`
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Send document error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
