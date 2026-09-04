import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function fixUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace('subase.co', 'supabase.co');
}
