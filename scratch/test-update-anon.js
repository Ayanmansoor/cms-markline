import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testAnonUpdate() {
  console.log("Testing collectionBanner update with anon key...");
  const { data: colData, error: colError } = await supabase
    .from('collectionBanner')
    .update({ isEnable: true })
    .eq('id', 1)
    .select();

  if (colError) {
    console.error("collectionBanner anon update error:", colError.message);
  } else {
    console.log("collectionBanner anon update success:", colData);
  }

  console.log("\nTesting HomeBanner update with anon key...");
  const { data: homeData, error: homeError } = await supabase
    .from('HomeBanner')
    .update({ isEnable: true })
    .eq('id', 'c618d82e-eec9-4a13-aaa5-ac658b4f8b0c')
    .select();

  if (homeError) {
    console.error("HomeBanner anon update error:", homeError.message);
  } else {
    console.log("HomeBanner anon update success:", homeData);
  }
}

testAnonUpdate();
