const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: sales } = await supabase.from('sales').select('*');
  const { data: customers } = await supabase.from('customers').select('*');
  console.log("SALES:", sales);
  console.log("CUSTOMERS:", customers);
}
run();
