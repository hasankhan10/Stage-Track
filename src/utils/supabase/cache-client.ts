import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client that does NOT use cookies.
 * Safe to use inside `unstable_cache()` because it avoids
 * calling `cookies()` (a dynamic data source).
 *
 * Pass the user's access_token for RLS to work correctly.
 */
export function createCacheClient(accessToken: string) {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    )
}
