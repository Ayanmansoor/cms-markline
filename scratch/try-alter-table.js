import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function alterTable() {
  console.log("Attempting to add columns to claim-products table...");
  
  // We don't have a direct SQL execution client, but let's check if we can run RPC for raw SQL.
  // Many supabase projects have an 'exec_sql' or 'run_sql' or 'sql' function for migrations/scratch scripts.
  const query = `
    ALTER TABLE "claim-products" 
    ADD COLUMN IF NOT EXISTS "pickup_date" timestamptz,
    ADD COLUMN IF NOT EXISTS "courier_name" text,
    ADD COLUMN IF NOT EXISTS "tracking_number" text;
  `;

  // Try common SQL RPC names
  const rpcs = ['exec_sql', 'run_sql', 'sql', 'execute_sql'];
  
  for (const rpc of rpcs) {
    console.log(`Trying RPC: ${rpc}...`);
    const { data, error } = await supabase.rpc(rpc, { sql: query, query: query });
    if (!error) {
      console.log(`✅ Success with RPC: ${rpc}!`);
      return;
    } else {
      console.log(`❌ Failed with RPC ${rpc}:`, error.message);
    }
  }

  console.log("Could not alter table structure via RPC.");
}

alterTable();
