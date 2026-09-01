import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
  console.log("Testing join between claim-products and address...");
  const { data, error } = await supabase
    .from('claim-products')
    .select('*, address_details:address(*)')
    .limit(1);

  if (error) {
    console.log("Join failed:", error.message);
    
    // Let's try fetching separately
    console.log("Fetching separately...");
    const { data: claims } = await supabase.from('claim-products').select('*').limit(1);
    if (claims && claims.length > 0 && claims[0].address) {
      const { data: addr, error: addrError } = await supabase
        .from('address')
        .select('*')
        .eq('id', claims[0].address)
        .single();
      console.log("Separate address fetch success:", addr);
    } else {
      console.log("No address ID present in claim sample row.");
    }
  } else {
    console.log("Join succeeded. Result:", data);
  }
}

testJoin();
