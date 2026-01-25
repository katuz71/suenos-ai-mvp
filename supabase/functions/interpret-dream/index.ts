import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from interpret-dream Function!")

serve(async (req) => {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    // This allows your mobile app to call this function.
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Parse request body
        const { dream_text, user_context, is_chat } = await req.json()
        if (!dream_text) {
            throw new Error('Dream text is required')
        }

        // 3. Initialize Supabase Admin Client
        // We need the SERVICE_ROLE_KEY to bypass RLS and update user credits.
        // This key is availble automatically in Supabase Edge Functions environment.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Get the user from the authorization header (Auth Token sent by app)
        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // 5. Check User Credits / Premium Status
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('credits, is_premium') // Assuming is_premium is a field, if not strict to credits
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            throw new Error('Profile not found')
        }

        // Logic: Free if premium, otherwise costs 1 credit
        // Note: You might need to adjust "is_premium" logic depending on how you store it (revenuecat sync or local field)
        // For MVP safety, we trust the database field.
        const hasEnergy = profile.credits > 0;
        // We assume 'is_premium' might be managed by webhook or revenuecat sync. 
        // If you don't have is_premium in DB yet, rely only on credits for now.

        if (!hasEnergy && !profile.is_premium) {
            throw new Error('Insufficient energy')
        }

        // 6. Call OpenAI
        // The API Key is securely stored in Supabase Secrets (OPENAI_API_KEY)
        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            console.error("OPENAI_API_KEY is not set in Supabase Secrets")
            throw new Error('Server configuration error')
        }

        const systemPrompt = `
    ROLE:
    Eres Luna, una guía espiritual y mística que interpreta las señales del universo.
    El usuario se llama ${user_context?.name || 'Viajero'}. Su signo es ${user_context?.zodiac || ''}.
    
    TUS REGLAS (STRICT):
    1. Responde SIEMPRE en ESPAÑOL.
    2. Usa un tono místico, empático y profundo.
    3. Estructura: Breve saludo místico, Interpretación simbólica, CIERRE con pregunta reflexiva.
    4. NUNCA menciones que eres una IA.
    ${is_chat ? '5. MODO CHAT: Responde a la pregunta del usuario manteniendo el contexto del sueño.' : ''}
    `

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: is_chat ? dream_text : `He soñado con: "${dream_text}"` }
                ],
                max_tokens: 450,
                temperature: 0.8,
            }),
        })

        const aiData = await response.json()
        const interpretation = aiData.choices[0]?.message?.content

        if (!interpretation) {
            throw new Error('Failed to get interpretation from Universe')
        }

        // 7. Deduct Energy (if not premium) and Save History (Atomic Transaction ideally, but sequential here)
        let remaining = profile.credits;
        if (!profile.is_premium) {
            remaining = profile.credits - 1;
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ credits: remaining })
                .eq('id', user.id)

            if (updateError) console.error("Failed to deduct credit", updateError)
        }

        // 8. Log interpretation to DB (SKIP IF CHAT)
        let entry = null;
        if (!is_chat) {
            const { data: logData, error: logError } = await supabaseClient
                .from('interpretations')
                .insert({
                    user_id: user.id,
                    dream_text: dream_text,
                    interpretation_text: interpretation,
                    created_at: new Date().toISOString()
                })
                .select()
                .single()
            entry = logData;
        }


        // 9. Return Result
        return new Response(JSON.stringify({
            interpretation,
            remaining_credits: profile.is_premium ? '∞' : remaining,
            entry: entry
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
