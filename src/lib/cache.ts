/**
 * Caching helpers for Next.js Data Cache.
 *
 * Supabase fetches inside Server Components bypass Next.js's automatic
 * fetch-level cache because Supabase uses the Request API internally.
 * Wrapping queries in `cachedFetch` stores results in the Next.js Data Cache.
 *
 * ⚠️  IMPORTANT: The callback function must NOT call `createClient()` from
 * utils/supabase/server.ts — that calls cookies() which is forbidden inside
 * unstable_cache. Instead, receive a `createCacheClient(accessToken)` from the
 * caller which provides a cookie-free client.
 *
 * Usage in a server page:
 *   const supabase = await createClient()                    // outside cache
 *   const { data: { session } } = await supabase.auth.getSession()
 *   const data = await cachedFetch('key', session!.access_token, async (db) => {
 *     const { data } = await db.from('...').select(...)
 *     return data
 *   }, { revalidate: 60, tags: ['tag'] })
 */

import { unstable_cache } from 'next/cache'
import { createCacheClient } from '@/utils/supabase/cache-client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CacheOptions {
    /** Seconds until the cached entry is considered stale. Default: 60s */
    revalidate?: number
    /** Cache tags for on-demand invalidation via revalidateTag() */
    tags?: string[]
}

export function cachedFetch<T>(
    key: string | string[],
    accessToken: string,
    fn: (db: SupabaseClient) => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { revalidate = 60, tags = [] } = options
    const keyArray = Array.isArray(key) ? key : [key]

    // createCacheClient is called inside the cached fn — no cookies() used ✅
    return unstable_cache(
        async () => fn(createCacheClient(accessToken)),
        keyArray,
        { revalidate, tags }
    )()
}

// ─── Convenience tag builders ─────────────────────────────────────────────────

export const cacheTags = {
    clients: (workspaceId: string) => `clients-${workspaceId}`,
    pipeline: (workspaceId: string) => `pipeline-${workspaceId}`,
    invoices: (workspaceId: string) => `invoices-${workspaceId}`,
    tasks: (workspaceId: string) => `tasks-${workspaceId}`,
    outreach: (workspaceId: string) => `outreach-${workspaceId}`,
    dashboard: (userId: string) => `dashboard-${userId}`,
    user: (userId: string) => `user-${userId}`,
}
