const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDates() {
  console.log('Fetching payroll records...');
  const { data, error } = await supabase.from('gaji').select('id, periode_gaji');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data.length} records. Analyzing...`);

  for (const row of data) {
    // We want to force any date into the 1st of that month.
    // e.g. 2026-03-31 (which was intended for April) should be 2026-04-01
    // e.g. 2026-04-28 (intended for April) should be 2026-04-01
    
    const parts = row.periode_gaji.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);

    let targetMonth = month;
    let targetYear = year;

    // Logic: if day is 28th or more, it belongs to that month (normalized to 1st)
    // If day is 31 and month is 03, it's actually intended for April (timezone shift from 2026-04-01 00:00 local)
    if (day > 15 && day <= 31) {
       // Most likely the intended month
       // Special case for the known shift: 2026-03-31 is intended April
       if (month === 3 && day >= 30) {
         targetMonth = 4;
       }
    }

    const normalized = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

    if (row.periode_gaji !== normalized) {
      const { error: updateError } = await supabase
        .from('gaji')
        .update({ periode_gaji: normalized })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update ${row.id}:`, updateError);
      } else {
        console.log(`Updated ${row.id}: ${row.periode_gaji} -> ${normalized}`);
      }
    }
  }

  console.log('Cleanup complete.');
}

fixDates();
