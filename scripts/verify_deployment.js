const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const SUPABASE_URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log('🔄 Authenticating test user...');
    const email = 'autotest_agent@luna.ai';
    const password = 'TestPassword123!';

    let { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.log('⚠️ Sign in failed, attempting sign up...');
        const signUp = await supabase.auth.signUp({ email, password });
        session = signUp.data.session;
        if (signUp.error) {
            console.error('❌ Auth Failed:', signUp.error.message);
            return;
        }
    }

    if (!session) {
        console.error('❌ No session created. Maybe email confirmation is required?');
        // If email confirmation is on, we can't test easily. 
        // But usually for MVP it's off or we can use a trick? 
        // Let's hope it works or we get a useful error.
        return;
    }

    console.log('✅ Authenticated. User ID:', session.user.id);

    // Check credits
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', session.user.id).single();
    console.log('🔋 Current Credits:', profile?.credits);

    // Give some free credits if needed for test (requires admin, usually can't do this from client... 
    // BUT the Edge Function checks credits. 
    // If we have 0 credits, we expect an error "Insufficient energy". 
    // That ALSO verifies the code is running! 
    // But to verify OpenAI key, we NEED credits.
    // Wait, the client can't update credits itself (RLS). 
    // Use `daily-horoscope`? Or just hope we have 'welcome' credits?
    // Newly created users might not have a profile row or credits if triggers aren't set up.
    // Let's TRY calling the function.

    console.log('🔄 Calling interpret-dream...');

    const { data: funcData, error: funcError } = await supabase.functions.invoke('interpret-dream', {
        body: {
            dream_text: 'Привет, это тест. Я летаю во сне.',
            is_chat: false // Test full flow
        }
    });

    if (funcError) {
        console.error('❌ Function Error:', funcError);
    } else {
        console.log('✅ Function Response:', funcData);
        if (funcData.interpretation) {
            console.log('✨ SUCCESS! OpenAI responded.');
        } else if (funcData.error) {
            console.error('⚠️ Function Logic Error:', funcData.error);
        }
    }
}

test();
