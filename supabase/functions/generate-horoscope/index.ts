import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from generate-horoscope Function!")

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { sign, name } = await req.json()
        if (!sign) throw new Error('Sign is required')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) throw new Error('Unauthorized')

        // Optional: Check if user already has a horoscope for today to prevent spamming generic AI calls?
        // For now, we just check credits/subscription same as dreams.
        // Or maybe horoscopes are free? The original code didn't check credits explicitly in "generateDailyHoroscope", 
        // but the user might want to monetize it. 
        // Let's assume it costs 1 credit OR requires Premium, just like dreams, for safety. 
        // OR we can make it free. The audit said "Daily Horoscope". Usually these are free retention hooks.
        // Let's make it FREE but rate-limited by nature (e.g. valid logic). 
        // Wait, OpenAI costs money. Let's require at least 1 credit OR Premium, but maybe NOT deduct energy?
        // The original 'suenos.tsx' deducted for dreams. 
        // Let's look at useMonetization. 
        // Safe bet: Require User to be logged in. We won't deduct credits for Horoscope for now to keep it user-friendly,
        // UNLESS the prompt is very complex.
        // Actually, to stop abuse, let's just check they exist.

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) throw new Error('Server configuration error')

        const systemPrompt = `
    ROLE:
    Eres Luna, la astróloga mística que lee las estrellas.
    Usuario: ${name} (${sign}).
    
    TUS REGLAS:
    1. Idioma: Español.
    2. Estructura: Energía general, Amor/Relaciones, Trabajo/Fortuna, Consejo mágico.
    3. Tono: Positivo pero esotérico.
    4. RESPUESTA SEGURA: NUNCA digas que eres IA.
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
                    { role: 'user', content: `Dame el horóscopo de hoy para ${sign}.` }
                ],
                max_tokens: 400,
                temperature: 0.8,
            }),
        })

        const aiData = await response.json()
        const horoscope = aiData.choices[0]?.message?.content

        if (!horoscope) throw new Error('Stars are silent')

        return new Response(JSON.stringify({ horoscope }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
