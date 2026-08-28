import { createClient } from '@supabase/supabase-js'

// The "anon" key is meant to be public/embedded in client apps — that's how
// Supabase is designed to work. Access control lives in the row-level
// security policies you set up in the SQL editor, not in hiding this key.
const SUPABASE_URL = 'https://cwqbspelbfgaakpjfsgk.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cWJzcGVsYmZnYWFrcGpmc2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTE2MzgsImV4cCI6MjEwMzMyNzYzOH0.gD2aiKJCrdFV_zIPvWSN59WlxgiIF_SRHFv_fbjSZ3U'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/** Single-row table (see setup SQL) holding the whole shared queue/court state. */
export const STATE_TABLE = 'app_state'
export const STATE_ROW_ID = 'main'
