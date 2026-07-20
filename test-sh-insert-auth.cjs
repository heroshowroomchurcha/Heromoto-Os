const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const email = 'test_seeder_2@rideflow.com';
  const password = 'password123';
  console.log("Signing up...");
  let { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
  if (authErr) {
    console.log("Sign up failed, trying login...");
    const login = await supabase.auth.signInWithPassword({ email, password });
    authData = login.data;
    authErr = login.error;
  }
  
  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }
  
  console.log("Authenticated as:", authData.user.id);
  
  const shSeeds = [
    { model: 'Honda Livo', cc: 110, color: 'Grey', price: 40000, registration_number: 'PENDING' },
    { model: 'Hero iSmart', cc: 110, color: 'Red Black', price: 28000, registration_number: 'PENDING' },
    { model: 'Bajaj Pulsar', cc: 150, color: 'Black', price: 35000, registration_number: 'PENDING' },
    { model: 'Bajaj Discover', cc: 150, color: 'Black Blue', price: 20000, registration_number: 'PENDING' },
    { model: 'Honda Dream Yuga', cc: 110, color: 'Not specified', price: 26000, registration_number: 'PENDING' },
    { model: 'Honda Unicorn', cc: 160, color: 'Red', price: 35000, registration_number: 'PENDING' },
    { model: 'Honda Shine', cc: 100, color: 'Black (Red patti)', price: 45000, stock: 2, registration_number: 'PENDING' },
    { model: 'Honda Shine', cc: 100, color: 'Black Yellow', price: 45000, registration_number: 'PENDING' },
    { model: 'Honda Shine', cc: 125, color: 'Red Black (Red patti)', price: 36000, registration_number: 'PENDING' },
    { model: 'Honda Shine', cc: 125, color: 'Grey (White patti)', price: 42000, registration_number: 'PENDING' },
    { model: 'Hero HF 100', cc: 100, color: 'Black (Blue patti)', price: 60000, registration_number: 'PENDING' },
    { model: 'Hero Glamour', cc: 125, color: 'Blue', price: 80000, registration_number: 'PENDING' },
    { model: 'Honda Shine BS6', cc: 125, color: 'Black (Red patti)', price: 45000, registration_number: 'PENDING' },
    { model: 'Hero Destini', cc: 110, color: 'Black', price: 25000, registration_number: 'PENDING' }
  ];

  console.log("Inserting seeds...");
  const { data, error } = await supabase.from('second_hand_inventory').insert(shSeeds).select();
  console.log("Data:", data ? data.length : data, "Error:", error);
}
run();
