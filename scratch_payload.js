import fs from 'fs';
const dotenv = {};
try {
  const content = fs.readFileSync('.env', 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.match(/^\s*([\w_]+)\s*=\s*['"]?(.*?)['"]?\s*$/);
    if (parts) dotenv[parts[1]] = parts[2];
  });
} catch(e) {}

async function run() {
  const headers = {
    'apikey': dotenv.NEXT_PUBLIC_SUPABASE_KEY || dotenv.NEXT_PUBLIC_ANON_KEY || '',
    'Authorization': 'Bearer ' + (dotenv.SUPABASE_SERVICE_ROLE_KEY || dotenv.NEXT_PUBLIC_ANON_KEY || '')
  };

  const orderId = 'd9f1d7b2-371e-4064-8fa0-4304ed983c39';
  const url = `https://qmtfmhylybgxvvihpaxw.supabase.co/rest/v1/orders?select=*,address(*),order_items(*,product(id,name,slug))&id=eq.${orderId}&limit=1`;
  const resOrders = await fetch(url, { headers });
  const orders = await resOrders.json();
  const order = orders[0];

  const warehouseId = order.warehouse_id || 1;
  const resWh = await fetch(`https://qmtfmhylybgxvvihpaxw.supabase.co/rest/v1/warehouses?select=*&id=eq.${warehouseId}`, { headers });
  const warehouses = await resWh.json();
  const warehouse = warehouses[0];

  const addr = order.address;
  const nameParts = 'Ayan'.trim().split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '';

  const orderItems = (order.order_items || []).map((item) => ({
    name: item.product?.name || 'Markline Product',
    sku: `MKL-${item.product_id}-${item.variant_id || 'VAR'}`,
    units: item.quantity,
    selling_price: parseFloat(item.unit_price || '0'),
    discount: parseFloat(item.discount_amount || '0') || '',
    tax: '',
    hsn: ''
  }));

  const isReturn = 0;
  const orderId8 = orderId.slice(0, 8).toUpperCase();
  const shiprocketOrderId = `MKL-${orderId8}-FWD-${Date.now().toString().slice(-6)}`;

  const payload = {
    order_id: shiprocketOrderId,
    order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    pickup_location: warehouse.name,
    comment: 'Handle with care',
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: addr?.full_address || addr?.address_line_1 || '',
    billing_address_2: addr?.address_line_2 || '',
    billing_city: addr?.city || '',
    billing_pincode: parseInt(addr?.pin_code || addr?.pincode || '0'),
    billing_state: addr?.state_name || addr?.state || '',
    billing_country: 'India',
    billing_email: 'customer@shopmarkline.com',
    billing_phone: parseInt((addr?.recipientPhone || '').replace(/\D/g, '')) || 9999999999,
    shipping_is_billing: true,
    shipping_customer_name: firstName,
    shipping_last_name: lastName,
    shipping_address: addr?.full_address || addr?.address_line_1 || '',
    shipping_address_2: addr?.address_line_2 || '',
    shipping_city: addr?.city || '',
    shipping_pincode: parseInt(addr?.pin_code || addr?.pincode || '0'),
    shipping_state: addr?.state_name || addr?.state || '',
    shipping_country: 'India',
    shipping_email: 'customer@shopmarkline.com',
    shipping_phone: parseInt((addr?.recipientPhone || '').replace(/\D/g, '')) || 9999999999,
    order_items: orderItems,
    payment_method: order.payment_status === 'PAID' ? 'Prepaid' : 'COD',
    shipping_charges: parseFloat(order.shipping_charge || '0'),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: parseFloat(order.discount_amount || '0'),
    sub_total: parseFloat(order.subtotal || '0'),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
    is_return: isReturn
  };

  console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
}

run();
