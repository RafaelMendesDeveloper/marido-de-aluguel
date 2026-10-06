import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

/** false quando o build foi feito sem as variáveis do Supabase. */
export const supabaseConfigurado = Boolean(url && chave)

export const supabase = createClient(url || 'http://localhost:54321', chave || 'chave-ausente', {
  auth: { persistSession: true, autoRefreshToken: true },
})
