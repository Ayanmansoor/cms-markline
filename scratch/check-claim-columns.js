import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log("Fetching one row from claim-products...");
  const { data, error } = await supabase
    .from('claim-products')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching claim-products:", error);
  } else {
    console.log("claim-products row sample:", data);
  }
}

checkColumns();
