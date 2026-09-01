import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Listing tables...");
  const { data, error } = await supabase
    .rpc('get_tables'); // standard supabase helper or let's query pg_catalog

  if (error) {
    console.log("RPC get_tables not available. Querying pg_class...");
    const { data: tables, error: sqlError } = await supabase
      .from('pg_catalog.pg_class')
      .select('relname')
      .eq('relkind', 'r');
    
    if (sqlError) {
      // Let's execute a direct query via a common table check or schema query
      console.error("SQL query error:", sqlError);
    } else {
      console.log("Tables:", tables.map(t => t.relname));
    }
  } else {
    console.log("Tables:", data);
  }
}

// Let's run a raw query using a known table or search for other table names
async function testQuery() {
  // Let's query pg_tables
  const { data, error } = await supabase
    .from('_pg_tables') // typically not accessible or error, let's try raw sql if we have an rpc
    .select('*');
  console.log("result:", data, error);
}

// Let's list some known collections / tables that might be related to pickups
async function checkKnownTables() {
  const tables = ['pickup', 'claim_pickup', 'claim-pickups', 'pickups', 'schedule_pickup', 'schedule-pickups', 'claim_pickups'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table '${table}' exists!`, data);
    } else {
      console.log(`Table '${table}' does not exist:`, error.message);
    }
  }
}

checkKnownTables();
