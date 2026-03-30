import { createClient } from '@supabase/supabase-js'

// Client for startup data (read-only, view_startups_export)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// Client for project data (cs_followup, message_history, custom_templates)
const projectUrl = process.env.SUPABASE_PROJECT_URL
const projectKey = process.env.SUPABASE_PROJECT_KEY
export const db = createClient(projectUrl, projectKey)
