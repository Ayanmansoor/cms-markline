import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*['"]?(.*?)['"]?\s*$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const API_URL = env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
const EMAIL = env.SHIPROCKET_API_EMAIL;
const PASSWORD = env.SHIPROCKET_API_PASSWORD;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function formatAddress(addr) {
  if (!addr) return 'Bldg 1, Main Road';
  if (/\d/.test(addr)) return addr;
  return 'Flat No. 1, ' + addr;
}

async function main() {
  console.log('=== Shiprocket Integration Test & Cleanup Script ===\n');

  // 1. Authenticate with Shiprocket
  console.log('1. Authenticating with Shiprocket API...');
  const authRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  const authData = await authRes.json();
  if (!authRes.ok || !authData.token) {
    console.error('FAILED: Could not authenticate with Shiprocket:', authData);
    process.exit(1);
  }
  const token = authData.token;
  console.log('SUCCESS: Authenticated with Shiprocket token.');

  // 2. Fetch Pickup Locations
  console.log('\n2. Fetching Pickup Locations from Shiprocket...');
  const pickupRes = await fetch(`${API_URL}/settings/company/pickup`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pickupData = await pickupRes.json();
  const locations = pickupData?.data?.shipping_address || [];

  console.log(`Found ${locations.length} pickup location(s):`);
  locations.forEach((loc) => {
    const statusText = loc.status === 1 ? 'ACTIVE (1)' : `INACTIVE (${loc.status})`;
    console.log(` - Nickname: "${loc.pickup_location}" | Status: ${statusText} | City: ${loc.city} | Pin: ${loc.pin_code}`);
  });

  // Pick an active pickup location if available, otherwise use default
  const activeLoc = locations.find(l => l.status === 1);
  const pickupNickname = activeLoc ? activeLoc.pickup_location : (locations[0]?.pickup_location || 'MarklineWarehouse');

  console.log(`Using pickup location: "${pickupNickname}"`);

  // 3. Test Order Creation with order d9f1d7b2-371e-4064-8fa0-4304ed983c39
  console.log('\n3. Testing Shipment Creation for Order d9f1d7b2-371e-4064-8fa0-4304ed983c39...');
  const targetOrderId = 'd9f1d7b2-371e-4064-8fa0-4304ed983c39';
  const { data: order } = await supabase
    .from('orders')
    .select('*, address(*), order_items(*, product(id, name, slug))')
    .eq('id', targetOrderId)
    .single();

  if (!order) {
    console.error(`Order ${targetOrderId} not found in Supabase.`);
    return;
  }

  const addr = order.address;
  const testShiprocketOrderId = `MKL-TEST-CLEANUP-${Date.now().toString().slice(-6)}`;

  const payload = {
    order_id: testShiprocketOrderId,
    order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    pickup_location: pickupNickname,
    comment: 'Automated test shipment',
    billing_customer_name: addr?.recipientName || 'Ayan',
    billing_last_name: 'Mansoor',
    billing_address: formatAddress(addr?.full_address || 'Flat No. 1, zabunnisa apt'),
    billing_address_2: '',
    billing_city: addr?.city || 'Thane',
    billing_pincode: String(addr?.pin_code || '400612'),
    billing_state: addr?.state_name || 'Maharashtra',
    billing_country: 'India',
    billing_email: 'ayanmansoor0919@gmail.com',
    billing_phone: String(parseInt((addr?.recipientPhone || '9702456322').replace(/\D/g, '')) || 9702456322),
    shipping_is_billing: true,
    shipping_customer_name: addr?.recipientName || 'Ayan',
    shipping_last_name: 'Mansoor',
    shipping_address: formatAddress(addr?.full_address || 'Flat No. 1, zabunnisa apt'),
    shipping_address_2: '',
    shipping_city: addr?.city || 'Thane',
    shipping_pincode: String(addr?.pin_code || '400612'),
    shipping_state: addr?.state_name || 'Maharashtra',
    shipping_country: 'India',
    shipping_email: 'ayanmansoor0919@gmail.com',
    shipping_phone: String(parseInt((addr?.recipientPhone || '9702456322').replace(/\D/g, '')) || 9702456322),
    order_items: [
      {
        name: order.order_items[0]?.product?.name || 'Kolhapuri Sandals',
        sku: 'MKL-28-35',
        units: 1,
        selling_price: 890,
        discount: '',
        tax: '',
        hsn: ''
      }
    ],
    payment_method: 'Prepaid',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: 890,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
    is_return: 0
  };

  const createRes = await fetch(`${API_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  const createData = await createRes.json();
  console.log('Shiprocket Create Order HTTP Status:', createRes.status);
  console.log('Shiprocket Create Order Response:', JSON.stringify(createData, null, 2));

  // 4. Clean up / Cancel created test order in Shiprocket
  if (createData && createData.order_id) {
    console.log(`\n4. Cleaning up test order ID ${createData.order_id} in Shiprocket...`);
    const cancelRes = await fetch(`${API_URL}/orders/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: [createData.order_id] })
    });
    const cancelData = await cancelRes.json();
    console.log('Shiprocket Cancel Response:', cancelData);
    console.log('SUCCESS: Test order cancelled and cleaned up!');
  }

  // 5. Clean up any leftover test shipments in Supabase shipments table
  console.log('\n5. Checking and cleaning Supabase test shipments table...');
  const { data: testShipments } = await supabase
    .from('shipments')
    .select('*')
    .ilike('shiprocket_order_id', '%TEST%');

  if (testShipments && testShipments.length > 0) {
    console.log(`Deleting ${testShipments.length} test shipment rows from Supabase...`);
    await supabase.from('shipments').delete().ilike('shiprocket_order_id', '%TEST%');
    console.log('Cleaned up test shipments from Supabase.');
  } else {
    console.log('No test shipment rows found in Supabase DB.');
  }

  console.log('\n=== All Tests & Cleanups Completed Successfully ===');
}

main().catch(console.error);
