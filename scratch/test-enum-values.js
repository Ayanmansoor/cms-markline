import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const statuses = [
  'pending', 'PENDING',
  'approve', 'APPROVE', 'approved', 'APPROVED',
  'cancel', 'CANCEL', 'cancelled', 'CANCELLED', 'cancle', 'CANCLE',
  'on hold', 'ON HOLD', 'on_hold', 'ON_HOLD',
  'complete', 'COMPLETE', 'completed', 'COMPLETED'
];

async function testStatuses() {
  console.log("Testing status updates to find valid enum values...");
  
  // Fetch a claim to use
  const { data: claims } = await supabase.from('claim-products').select('id, status').limit(1);
  if (!claims || claims.length === 0) {
    console.error("No claim found to test");
    return;
  }
  const claimId = claims[0].id;
  const originalStatus = claims[0].status;
  console.log(`Using claim ID ${claimId} with original status: ${originalStatus}`);

  for (const status of statuses) {
    const { data, error } = await supabase
      .from('claim-products')
      .update({ status })
      .eq('id', claimId)
      .select();

    if (error) {
      console.log(`❌ Status '${status}' failed:`, error.message);
    } else {
      console.log(`✅ Status '${status}' SUCCEEDED!`);
    }
  }

  // Restore original
  await supabase.from('claim-products').update({ status: originalStatus }).eq('id', claimId);
  console.log("Restored original status.");
}

testStatuses();
