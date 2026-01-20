import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, 
});

// --- DREAM INTERPRETATION ---
export const interpretDream = async (
  text: string, 
  userContext?: { name: string; zodiac: string }
) => {
  const userName = userContext?.name || 'Viajero';
  const userZodiac = userContext?.zodiac || '';

  if (!text || text.trim().length === 0) {
    throw new Error('El texto del sueño no puede estar vacío.');
  }

  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    throw new Error('API Key no configurada.');
  }

  // System prompt following the Luna Persona directives
  const systemPrompt = `
    Eres Luna, una guía espiritual y mística que interpreta las señales del universo.
    El usuario se llama ${userName}. Su signo es ${userZodiac}.
    
    TUS REGLAS:
    1. Responde SIEMPRE в ESPAÑOL.
    2. Usa un tono místico, empático y profundo. Evita términos técnicos.
    3. Si hay un signo zodiacal (${userZodiac}), conéctalo con el significado del sueño.
    4. Estructura: Saludo místico -> Interpretación simbólica -> Pregunta emocional final.
    5. NUNCA menciones que eres una IA, bot o modelo de lenguaje. Eres Luna.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `He soñado con: "${text}"` }
      ],
      max_tokens: 350,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('El universo está en silencio.');
    }

    return response.trim();

  } catch (error) {
    console.error('OpenAI Error:', error);
    handleError(error);
    return "";
  }
};

// --- DAILY HOROSCOPE ---
export const generateDailyHoroscope = async (
  sign: string,
  name: string
) => {
  if (!sign) throw new Error('Signo requerido');

  const systemPrompt = `
    Eres una astróloga mística. Crea un horóscopo diario para ${sign}.
    Usuario: ${name}.
    
    Estructura (en Español):
    1. Energía general del día (misteriosa).
    2. Amor y Relaciones.
    3. Trabajo y Fortuna.
    4. Consejo mágico de Luna.
    
    Tono: Positivo pero esotérico. Longitud: ~150 palabras.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Dame mi horóscopo de hoy." }
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Error al leer las estrellas.');

    return response.trim();

  } catch (error) {
    console.error('Horoscope Error:', error);
    handleError(error);
    return "";
  }
};

// --- ERROR HANDLER (In Spanish) ---
const handleError = (error: any) => {
  let msg = 'Error de conexión cósmica.';
  
  if (error instanceof Error) {
    if (error.message.includes('insufficient_quota')) {
      msg = 'El universo está sobrecargado. Inténtalo más tarde.';
    } else if (error.message.includes('rate_limit')) {
      msg = 'Demasiadas señales a la vez. Espera un momento.';
    }
  }
  
  throw new Error(msg);
};

export { openai };