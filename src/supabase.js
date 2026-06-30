import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sgrpwngqegklyvwcgyzz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncnB3bmdxZWdrbHl2d2NneXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjQwMDQsImV4cCI6MjA5ODI0MDAwNH0.KpoeMeFDC90njKzM3zZQXoMDdR4LrkDb59aqBnp_SzM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
