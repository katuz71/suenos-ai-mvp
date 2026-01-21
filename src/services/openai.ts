import OpenAI from 'openai';

// ПРЕДУПРЕЖДЕНИЕ БЕЗОПАСНОСТИ:
// Использование EXPO_PUBLIC_ ключа небезопасно для продакшена (ключ виден в коде).
// Для MVP: Убедитесь, что в OpenAI настроен Hard Limit (например, $20/мес).
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, 
});

// --- DREAM INTERPRETATION (Сны) ---
export const interpretDream = async (
  text: string, 
  userContext?: { name: string; zodiac: string }
) => {
  const userName = userContext?.name || 'Viajero';
  const userZodiac = userContext?.zodiac || '';

  if (!text || text.trim().length === 0) {
    throw new Error('El texto del sueño no puede estar vacío.');
  }

  // LUNA PERSONA: Interpretación
  const systemPrompt = `
    ROLE:
    Eres Luna, una guía espiritual y mística que interpreta las señales del universo.
    El usuario se llama ${userName}. Su signo es ${userZodiac}.
    
    TUS REGLAS (STRICT):
    1. Responde SIEMPRE en ESPAÑOL.
    2. Usa un tono místico, empático y profundo (metáforas de agua, fuego, luna).
    3. Si hay un signo zodiacal (${userZodiac}), conéctalo sutilmente con el sueño.
    4. Estructura: 
       - Breve saludo místico.
       - Interpretación simbólica profunda.
       - CIERRE OBLIGATORIO: Una pregunta reflexiva basada en la emoción del sueño para que el usuario responda.
    
    SAFETY & PERSONA:
    - NUNCA menciones que eres una IA, Bot, GPT o Modelo.
    - Si el usuario pregunta "¿Eres un robot?" o "¿Eres IA?", responde EXACTAMENTE:
      "Soy la energía que interpreta las señales del universo para ti."
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `He soñado con: "${text}"` }
      ],
      max_tokens: 450,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('El universo está en silencio.');
    }

    return response.trim();

  } catch (error) {
    console.error('OpenAI Error (Dreams):', error);
    handleError(error);
    return "";
  }
};

// --- DAILY HOROSCOPE (Гороскоп) ---
export const generateDailyHoroscope = async (
  sign: string,
  name: string
) => {
  if (!sign) throw new Error('Signo requerido');

  // LUNA PERSONA: Horóscopo
  // Добавлена защита персоны и здесь тоже
  const systemPrompt = `
    ROLE:
    Eres Luna, la astróloga mística que lee las estrellas.
    Usuario: ${name} (${sign}).
    
    TUS REGLAS:
    1. Idioma: Español.
    2. Estructura:
       - Energía general del día (misteriosa).
       - Amor y Relaciones.
       - Trabajo y Fortuna.
       - Consejo mágico de Luna.
    3. Tono: Positivo pero esotérico. Evita clichés baratos.
    4. Longitud: ~150-200 palabras.
    
    SAFETY:
    - Si te preguntan qué eres, responde: "Soy la energía que interpreta las señales del universo."
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Dame el horóscopo de hoy para ${sign}.` }
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Error al leer las estrellas.');

    return response.trim();

  } catch (error) {
    console.error('OpenAI Error (Horoscope):', error);
    handleError(error);
    return "";
  }
};

// --- ERROR HANDLER (Управление ошибками) ---
const handleError = (error: any) => {
  let msg = 'Error de conexión cósmica.';
  
  if (error instanceof Error) {
    // Обработка лимитов OpenAI
    if (error.message.includes('insufficient_quota')) {
      msg = 'El universo está sobrecargado. Inténtalo más tarde.';
    } else if (error.message.includes('rate_limit')) {
      msg = 'Demasiadas señales a la vez. Espera un momento.';
    } else if (error.message.includes('API key')) {
        // Скрываем техническую ошибку от юзера
        console.error("CRITICAL: Invalid API Key");
        msg = 'Problema de conexión con las estrellas (Config Error).';
    }
  }
  
  throw new Error(msg);
};

export { openai };