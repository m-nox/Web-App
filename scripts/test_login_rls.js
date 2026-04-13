require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  const email = 'dewa.bagusalif@gmail.com';
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Hris123!'
  });

  if (error) {
    console.error('Login error:', error.message);
    return;
  }

  console.log('Logged in as:', data.user.email);

  const { data: profile, error: profileError } = await supabase
    .from('karyawan')
    .select('role')
    .eq('email', email)
    .single();

  console.log('Profile fetch result:', profile, profileError?.message);
}

testLogin();
