import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const id = 'c618d82e-eec9-4a13-aaa5-ac658b4f8b0c'; // From HomeBanner sample
  
  // Let's try toggle to false
  const updatePayload = { isEnable: false };
  console.log("Updating HomeBanner with:", updatePayload);
  
  const { data, error } = await supabase
    .from('HomeBanner')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Update error:", error);
  } else {
    console.log("Update success. Result:", data);
  }

  // Restore to true
  const restorePayload = { isEnable: true };
  console.log("Restoring HomeBanner with:", restorePayload);
  const { data: data2, error: error2 } = await supabase
    .from('HomeBanner')
    .update(restorePayload)
    .eq('id', id)
    .select()
    .single();

  if (error2) {
    console.error("Restore error:", error2);
  } else {
    console.log("Restore success. Result:", data2);
  }
}

testUpdate();
