import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
        }

        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
        }

        const adminClient = await createAdminClient()

        // Verify currentUser is an admin
        const { data: currentUserProfile } = await adminClient
            .from('users')
            .select('workspace_id, role')
            .eq('id', currentUser.id)
            .single()

        if (!currentUserProfile || currentUserProfile.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can remove users' }, { status: 403 })
        }

        // Verify the target user belongs to the SAME workspace
        const { data: targetUserProfile } = await adminClient
            .from('users')
            .select('workspace_id')
            .eq('id', userId)
            .single()

        if (!targetUserProfile || targetUserProfile.workspace_id !== currentUserProfile.workspace_id) {
            return NextResponse.json({ error: 'User not found in your workspace' }, { status: 404 })
        }

        // Delete from public.users explicitly
        const { error: dbError } = await adminClient
            .from('users')
            .delete()
            .eq('id', userId)

        if (dbError) throw dbError

        // Delete the user's auth credentials entirely so they cannot login
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

        if (authError) throw authError

        return NextResponse.json({ message: 'User removed completely' })
    } catch (error: any) {
        console.error('Error removing user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
