const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchSchema() {
  console.log("Fetching Supabase OpenAPI schema with service role key...");
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
    console.log("Tables found in database schema:");
    const paths = Object.keys(schema.paths || {});
    const tables = new Set();
    for (const path of paths) {
      const cleanPath = path.replace(/^\/|\/$/g, '');
      if (cleanPath && !cleanPath.includes('/')) {
        tables.add(cleanPath);
      }
    }

    console.log(Array.from(tables).sort());
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

fetchSchema();
