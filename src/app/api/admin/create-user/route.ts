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

        return NextResponse.json({ message: 'User created successfully', user: authUser.user })
    } catch (error: any) {
        console.error('Error in create-user API:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
