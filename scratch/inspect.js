import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://qmtfmhylybgxvvihpaxw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdGZtaHlseWJneHZ2aWhwYXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDE2MzQxNiwiZXhwIjoyMDU1NzM5NDE2fQ.h0AI3qMFjTvbJw2OL3ZrRY5s6IYwB16GzfAy252X27s"
)

async function inspectBlogs() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .limit(1)
  console.log("Blog record keys:", data && data.length > 0 ? Object.keys(data[0]) : null)
  console.log("Sample blog:", data && data.length > 0 ? data[0] : null)
  console.log("Error:", error)
}

inspectBlogs()
