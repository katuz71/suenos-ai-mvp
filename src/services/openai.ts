import OpenAI from 'openai';

// Инициализация клиента
// ВАЖНО: Убедись, что в .env файле ключ называется EXPO_PUBLIC_OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Разрешаем работу в Expo
});

// --- ТОЛКОВАНИЕ СНОВ ---
export const interpretDream = async (
  text: string, 
  userContext?: { name: string; zodiac: string }
) => {
  const userName = userContext?.name || 'Viajero'; // Странник -> Viajero
  const userZodiac = userContext?.zodiac || '';

  // Валидация
  if (!text || text.trim().length === 0) {
    throw new Error('El texto del sueño no puede estar vacío.');
  }

  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    throw new Error('API Key no configurada.');
  }

  // СИСТЕМНЫЙ ПРОМПТ (ES)
  const systemPrompt = `
    Eres Luna, una intérprete de sueños mística y guía cósmica.
    El usuario se llama ${userName}. Su signo es ${userZodiac}.
    
    TUS REGLAS:
    1. Responde SIEMPRE en ESPAÑOL.
    2. Usa un tono místico, empático y profundo.
    3. Si hay signo zodiacal (${userZodiac}), relaciónalo con el sueño (ej: "Tu naturaleza de Leo sugiere...").
    4. Estructura: Saludo místico -> Interpretación simbólica -> Pregunta emocional final.
    5. Sé breve pero impactante.
  `;

  const userMessage = `Sueño: "${text}"`;

  console.log(`🔮 [AI] Interpretando para: ${userName} (${userZodiac})`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Или gpt-3.5-turbo
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
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
    return ""; // TypeScript fallback
  }
};

// --- ГОРОСКОП ---
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
    4. Consejo mágico.
    
    Tono: Positivo pero esotérico. No inventes fechas, es para HOY.
    Longitud: ~150 palabras.
  `;

  console.log(`🔮 [AI] Generando horóscopo: ${sign}`);

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

// --- ОРАКУЛ (С ИИ) ---
// Используется, если ты решишь включить ИИ для сложных вопросов
export const askOracleAI = async (question: string) => {
  const systemPrompt = `
    Eres un Oráculo antiguo. Responde a la pregunta del usuario con una frase críptica pero sabia.
    Idioma: Español.
    Máximo 2 frases.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question || "Dame una señal." }
      ],
      max_tokens: 60,
      temperature: 0.9,
    });

    return completion.choices[0]?.message?.content?.trim() || "El destino es incierto.";
  } catch (error) {
    handleError(error);
    return "El oráculo duerme.";
  }
};

// --- ОБРАБОТЧИК ОШИБОК (На испанском) ---
const handleError = (error: any) => {
  let msg = 'Error de conexión cósmica.';
  
  if (error instanceof Error) {
    if (error.message.includes('insufficient_quota')) {
      msg = 'El universo está sobrecargado (Quota).';
    } else if (error.message.includes('rate_limit')) {
      msg = 'Demasiadas preguntas a las estrellas. Espera un poco.';
    } else if (error.message.includes('API Key')) {
      msg = 'Llave maestra incorrecta (API Key).';
    }
  }
  
  throw new Error(msg);
};

export { openai };