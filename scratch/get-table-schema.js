import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchema() {
  console.log("Querying table columns for claim-products...");
  const { data, error } = await supabase
    .from('claim-products')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }
  
  // Let's run a raw sql query via RPC if there's one, or search database
  // Wait, let's query information_schema if we can, but usually PostgREST does not expose pg_catalog/information_schema directly.
  // Wait, does it? Let's check.
  console.log("Sample row keys:", Object.keys(data[0] || {}));
}

getSchema();
