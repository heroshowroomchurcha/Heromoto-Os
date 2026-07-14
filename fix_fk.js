const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// We can't use DDL directly from anon key usually, but let's try if there's an RPC or we can just use psql?
// We don't have psql credentials. We can only use what's in .env
