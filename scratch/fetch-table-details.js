const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchTableDetails() {
  console.log("Fetching Supabase OpenAPI schema table details...");
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch schema:", response.status, response.statusText);
      return;
    }

    const schema = await response.json();
    
    console.log("\n'orders' columns:");
    if (schema.definitions['orders']) {
      console.log(Object.keys(schema.definitions['orders'].properties));
    } else {
      console.log("No definition for orders");
    }

    console.log("\n'address' columns:");
    if (schema.definitions['address']) {
      console.log(Object.keys(schema.definitions['address'].properties));
    } else {
      console.log("No definition for address");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

fetchTableDetails();
