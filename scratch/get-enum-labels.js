import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getEnumLabels() {
  console.log("Fetching enum labels...");
  const { data, error } = await supabase
    .rpc('get_enum_values', { enum_name: 'order-claim' }); // if RPC exists

  if (error) {
    console.log("RPC get_enum_values failed:", error.message);
    
    // Let's query using Postgres catalog via REST API (if pg_catalog is exposed)
    const { data: enumData, error: catalogError } = await supabase
      .from('pg_enum') // usually not exposed, let's see
      .select('*');
    if (catalogError) {
      console.log("Could not query pg_enum directly:", catalogError.message);
      
      // Let's try to trigger a database query error that might list the enum values!
      // In Postgres, if we pass an invalid enum value, the error message lists the valid values!
      // For example: "invalid input value for enum "order-claim": "invalid_value""
      // Let's try that!
      const { error: triggerError } = await supabase
        .from('claim-products')
        .update({ status: 'INVALID_ENUM_VALUE_TEST' })
        .eq('id', 1);
        
      if (triggerError) {
        console.log("Triggered error message:");
        console.log(triggerError.message);
      }
    }
  } else {
    console.log("Enum values:", data);
  }
}

getEnumLabels();
