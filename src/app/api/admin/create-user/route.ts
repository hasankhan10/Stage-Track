import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin (optional: depends on how roles are stored, 
        // usually we assume the first user is admin or check a metadata field)
        // For now, we allow the request if the user is logged in, 
        // but in production, you should check a 'role' column in your users table.

        const { email, password, name } = await req.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminClient = await createAdminClient()

        // 1. Get the current user's workspace_id (Admins can only create users in their own workspace)
        const { data: currentUserProfile, error: profileError } = await adminClient
            .from('users')
            .select('workspace_id, role')
            .eq('id', currentUser.id)
            .single()

        if (profileError || !currentUserProfile) {
            return NextResponse.json({ error: 'Failed to identify your workspace. Ensure your admin profile is set up.' }, { status: 403 })
        }

        if (currentUserProfile.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
        }

        // 2. Create user in Auth
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        })

        if (authError) throw authError

        // 3. Insert into public.users table
        const { error: dbError } = await adminClient
            .from('users')
            .upsert({
                id: authUser.user.id,
                workspace_id: currentUserProfile.workspace_id,
                email,
                name,
                role: 'member' // Default to member
            })

        if (dbError) throw dbError
        console.log('✅ User created in DB:', authUser.user.id)

        // 4. Send Welcome Email via Resend
        let emailSent = false
        try {
            console.log('📧 Preparing to send email via Resend...')
            const { resend } = await import('@/lib/resend')

            const { data: workspace } = await adminClient
                .from('workspaces')
                .select('name')
                .eq('id', currentUserProfile.workspace_id)
                .single()

            const emailResponse = await resend.emails.send({
                from: `Your Brand <onboarding@${process.env.RESEND_DOMAIN || 'resend.dev'}>`,
                to: [email],
                subject: `Welcome to ${workspace?.name || 'Your Brand'}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h1 style="color: #1e3a5f; margin-bottom: 24px;">Welcome to the Team, ${name}!</h1>
                        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                            You have been invited to join <strong>${workspace?.name || 'Your Brand'}</strong>.
                        </p>
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Your Login Credentials:</p>
                            <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Password:</strong> ${password}</p>
                        </div>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                           style="display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Login to Dashboard
                        </a>
                    </div>
                `
            })

            if (emailResponse.error) {
                console.error('❌ Resend Error:', emailResponse.error)
            } else {
                console.log('✅ Email sent successfully:', emailResponse.data?.id)
                emailSent = true
            }
        } catch (emailErr: any) {
            console.error('❌ Critical Email Failure:', emailErr.message)
        }

        return NextResponse.json({
            message: emailSent ? 'User created and email sent!' : 'User created, but email delivery failed (Check Resend Dashboard).',
            user: authUser.user,
            emailSent,
            tempPassword: password
        })
    } catch (error: any) {
        console.error('Error in create-user API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
