import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the restaurant ID for the current user.
 * Uses LIMIT 1 so it is safe when duplicate rows exist (e.g. from StrictMode
 * double-firing the useEffect that calls this).  If no restaurant exists yet,
 * creates one and handles the rare race-condition insert conflict by re-querying.
 */
export async function getOrCreateRestaurant(
  supabase: SupabaseClient,
  userId: string,
  fallbackName = 'My Restaurant'
): Promise<string | null> {
  // Fetch the oldest restaurant for this user (LIMIT 1 tolerates duplicates)
  const { data: rows } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (rows?.[0]?.id) return rows[0].id

  // None found — create one
  const { data: created, error } = await supabase
    .from('restaurants')
    .insert({
      name: fallbackName,
      owner_id: userId,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    // Race condition: another concurrent call already inserted — re-query
    const { data: retry } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (retry?.[0]?.id) return retry[0].id

    console.error('Failed to create restaurant:', error.message)
    return null
  }

  return created.id
}
