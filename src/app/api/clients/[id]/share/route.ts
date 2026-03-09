import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Verify Authentication & Permissions
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Fetch Client Info
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('id, name, email, workspace_id')
            .eq('id', id)
            .single()

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        if (!client.email) {
            return NextResponse.json({ error: 'Client has no email address configured' }, { status: 400 })
        }

        // 3. Check if a link already exists, otherwise create one
        let tokenStr = ''
        const { data: existingLink } = await supabase
            .from('client_links')
            .select('token')
            .eq('client_id', client.id)
            .eq('link_type', 'progress')
            .single()

        if (existingLink) {
            tokenStr = existingLink.token
        } else {
            const { data: newLink, error: linkError } = await supabase
                .from('client_links')
                .insert({
                    client_id: client.id,
                    workspace_id: client.workspace_id,
                    link_type: 'progress',
                })
                .select('token')
                .single()

            if (linkError || !newLink) {
                throw linkError
            }
            tokenStr = newLink.token
        }

        // 4. Generate the Progress URL
        const progressUrl = `${APP_URL}/progress/${tokenStr}`

        // 5. Send the Email using Resend
        // Skip if no API key (e.g., local testing without billing setup)
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'updates@stovamedia.com', // Update with a verified domain
                to: client.email,
                subject: 'Your Project Progress Dashboard',
                html: `
          <h1>Hello ${client.name},</h1>
          <p>You can view the real-time progress of your project on our dedicated dashboard.</p>
          <p><a href="${progressUrl}" style="display:inline-block;padding:12px 24px;background-color:#000;color:#fff;text-decoration:none;border-radius:6px;">View Progress</a></p>
          <p>Alternatively, copy and paste this link into your browser:</p>
          <p>${progressUrl}</p>
        `
            })
        }

        // 6. Log Activity
        await supabase.from('activity_log').insert({
            client_id: client.id,
            action_type: 'link_shared',
            description: 'Progress link generated and sent to client'
        })

        return NextResponse.json({ success: true, url: progressUrl })

    } catch (error: any) {
        console.error('Share link error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
