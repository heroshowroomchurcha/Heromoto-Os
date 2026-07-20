const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking table...");
  const { data, error } = await supabase.from('second_hand_inventory').select('*');
  console.log("Data:", data ? data.length : data, "Error:", error);
  
  if (error) return;
  
  if (data && data.length === 0) {
    const shSeeds = [
      { model: 'Honda Livo', cc: 110, color: 'Grey', price: 40000, registration_number: 'PENDING' },
      { model: 'Hero iSmart', cc: 110, color: 'Red Black', price: 28000, registration_number: 'PENDING' },
    ];
    console.log("Attempting insert via ANON_KEY...");
    const { data: iData, error: iErr } = await supabase.from('second_hand_inventory').insert(shSeeds).select();
    console.log("Insert result:", iData, "Err:", iErr);
  }
}
run();
