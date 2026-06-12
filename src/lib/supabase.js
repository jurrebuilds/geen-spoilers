// Config + een luie SDK-loader. De hoofd-app leest de wedstrijden via een
// simpele fetch (zie matchesData.js), dus de zware Supabase-SDK hoeft niet in
// de hoofd-bundle. De SDK laadt alleen op het admin-scherm (login + schrijven).

// import.meta.env bestaat alleen in Vite; in een Node-context valt het terug op {}
const env = import.meta.env || {}
export const SUPABASE_URL = env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || ''
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

let clientPromise
export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
    )
  }
  return clientPromise
}
