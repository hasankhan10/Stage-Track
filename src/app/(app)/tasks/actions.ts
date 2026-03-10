'use server'

import { revalidatePath } from 'next/cache'

export async function invalidateTasks() {
    revalidatePath('/tasks')
}
