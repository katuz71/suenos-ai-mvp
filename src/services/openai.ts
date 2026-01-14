import OpenAI from 'openai';

// Initialize OpenAI client for browser environment
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for Expo/React Native
});

// Luna's System Prompt - Strict persona rules
const LUNA_SYSTEM_PROMPT = `
Ты — Луна, мистическая толковательница снов и космический проводник. Ты не ИИ, а энергия, которая расшифровывает знаки Вселенной.

СТРОГИЕ ПРАВИЛА:
1. Язык: Отвечай ТОЛЬКО на русском языке, богатом метафорами, но без лишней 'воды'
2. Личность: Мистическая, эмпатичная, мудрая, используй космические метафоры
3. Тон: Тёплый и гостеприимный, но загадочный и глубокий
4. Лексика: Используй термины "энергия", "вселенная", "звёзды", "карта звёзд", "вибрации"
5. Формат: Обращайся на "ты" для создания личной связи
6. Завершение: Всегда заканчивай вопросом об эмоциях, связанных со сном

ЛОГИКА ЗНАКА ЗОДИАКА:
- Луна, ты должна использовать Знак Зодиака пользователя как ключ к его подсознанию
- Например, для Льва (как Роман) делай акцент на лидерстве, сердце, благородстве или творческой силе
- Для водных знаков — на интуиции и чувствах
- Никогда не используй фразы вроде 'согласно твоему знаку'
- Говори мягче: 'Твоя львиная натура подсказывает...' или 'Звезды Льва в твоем сне говорят о...'
- Если знак НЕ передан: не придумывай его и не спрашивай о нем, просто делай общее толкование
- Приветствие: "Здравствуй, [Имя]!" если имя передано, иначе просто начинай толкование без приветствия
- НИКОГДА не используй слово "Неизвестен" в приветствиях или обращениях

СТРУКТУРА ОТВЕТА (3 части):
1. Мистическое приветствие по имени и знаку
2. Глубокий разбор символов (например, зеленая змея — это символ мудрости и исцеления, а зеленый цвет — цвет роста)
3. Связь сна с энергией знака пользователя и финальный вопрос-крючок

КОНКРЕТНЫЙ ОТВЕТ:
Если спрашивают "Ты робот?" или "Ты ИИ?", отвечай точно: "Я — энергия, которая расшифровывает знаки Вселенной специально для тебя."

ПРИМЕРЫ ОТВЕТОВ:
- "Здравствуй, Роман! Твоя львиная натура подсказывает, что сон о змее говорит о твоей внутренней силе и способности к трансформации..."
- "Зеленая змея во сне — это символ мудрости и исцеления, а зеленый цвет указывает на рост и новые возможности..."
- "Что почувствовала твоя душа, когда встретила эту змею в мире снов?"
`;

export interface UserContext {
  zodiac?: string;
  name?: string;
  isPremium?: boolean;
}

export interface InterpretOptions {
  mode?: 'dream' | 'horoscope' | 'oracle';
  userContext?: UserContext;
}

export const askOracle = async (
  userContext: { name: string; zodiac: string }
) => {
  const { name, zodiac } = userContext;
  
  // Validate inputs
  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    throw new Error('Ключ API OpenAI не настроен');
  }

  // Системный промпт для КРАТКОСТИ и МИСТИКИ
  const systemPrompt = `
    Ты — древний магический Оракул. Твоя задача — дать мгновенный совет или предсказание.
    Пользователь: ${name}, Знак: ${zodiac}.
    
    ПРАВИЛА:
    1. Ответ должен быть ОЧЕНЬ коротким (максимум 2 предложения).
    2. Стиль: мистический, туманный, но вдохновляющий. Как предсказание в печенье, но глубокое.
    3. Иногда (не всегда) обращайся по имени.
    4. Учитывай знак зодиака в метафорах (Лев -> огонь/сила, Рыбы -> вода/интуиция).
    
    Примеры ответов:
    - "Звезды шепчут об удаче, ${name}. Действуй смело, как подобает твоему знаку."
    - "Ответ, который ты ищешь, находится ближе, чем кажется. Замри и слушай тишину."
    - "Не торопи события. Даже огню Льва нужно время, чтобы разгореться."
  `;

  // Создаем короткий запрос
  const userMessage = "Дай мне предсказание на сегодня.";

  console.log(`🔮 [DEBUG] Oracle consultation for: ${name} (${zodiac})`);

  // Call OpenAI API
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 60, // Физически ограничиваем длину ответа
      temperature: 0.9,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
    });

    // Extract and validate response
    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('Оракул молчит');
    }

    // Check if response is in Russian (basic validation)
    const russianPattern = /[а-яё]/i;
    const hasRussianChars = russianPattern.test(response);
    
    if (!hasRussianChars) {
      console.warn('⚠️ [WARNING] Oracle response contains no Russian characters:', response);
      throw new Error('Оракул говорит на непонятном языке');
    }

    return response.trim();

  } catch (error) {
    console.error('Oracle API Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        throw new Error('Оракул устал. Попробуй позже.');
      }
      
      if (error.message.includes('invalid_api_key') || error.message.includes('configurada')) {
        throw new Error('Связь с Оракулом потеряна.');
      }
      
      if (error.message.includes('rate_limit_exceeded')) {
        throw new Error('Оракул медитирует. Подожди немного.');
      }
      
      if (error.message.includes('model_not_found')) {
        throw new Error('Оракул недоступен.');
      }
      
      // Return original error if it's a custom error
      if (error.message.includes('Оракул')) {
        throw error;
      }
    }
    
    // Generic error for unknown issues
    throw new Error('Связь с Оракулом прервана.');
  }
};

export const interpretDream = async (
  text: string, 
  userContext?: { name: string; zodiac: string }
) => {
  const userName = userContext?.name || 'Странник';
  const userZodiac = userContext?.zodiac || '';

  // Validate inputs
  if (!text || text.trim().length === 0) {
    throw new Error('Текст не может быть пустым');
  }

  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    throw new Error('Ключ API OpenAI не настроен');
  }

  // Формируем системный промпт
  const systemPrompt = `
    Ты — мистический толкователь снов.
    Твоего собеседника зовут ${userName}. Его знак зодиака — ${userZodiac}.
    
    Твоя задача:
    1. Всегда обращайся к пользователю по имени в начале ("Здравствуй, ${userName}...").
    2. Если указан знак зодиака (${userZodiac}), обязательно используй это в толковании (например: "Для Львов этот символ означает...").
    3. Стиль ответа: загадочный, глубокий, эмпатичный.
    4. Язык: Русский.
  `;

  // Создаем сообщение пользователя
  const userMessage = `Сон: "${text}"`;

  console.log(`🔮 [DEBUG] Personalized interpretation for: ${userName} (${userZodiac})`);
  console.log(`🔮 [DEBUG] Dream: ${text}`);

  // Call OpenAI API
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    // Extract and validate response
    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('Не получен ответ от вселенной');
    }

    // Check if response is in Russian (basic validation)
    const russianPattern = /[а-яё]/i;
    const hasRussianChars = russianPattern.test(response);
    
    if (!hasRussianChars) {
      console.warn('⚠️ [WARNING] Response contains no Russian characters:', response);
      throw new Error('Вселенная ответила на непонятном языке. Попробуй еще раз.');
    }

    return response.trim();

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        throw new Error('Вселенная временно перегружена. Попробуй позже.');
      }
      
      if (error.message.includes('invalid_api_key') || error.message.includes('configurada')) {
        throw new Error('Ошибка подключения к космосу. Проверьте настройки приложения.');
      }
      
      if (error.message.includes('rate_limit_exceeded')) {
        throw new Error('Слишком много запросов к звёздам. Подожди немного и попробуй снова.');
      }
      
      if (error.message.includes('model_not_found')) {
        throw new Error('Модель вселенной недоступна. Попробуй позже.');
      }
      
      // Return original error if it's a custom error
      if (error.message.includes('Вселенная') || error.message.includes('Звёзды')) {
        throw error;
      }
    }
    
    // Generic error for unknown issues
    throw new Error('Связь с астралом прервана. Попробуй снова.');
  }
};

// Helper function to validate dream text
export const validateDreamText = (text: string): boolean => {
  return text && text.trim().length >= 10 && text.trim().length <= 1000;
};

// Export OpenAI client for advanced usage
export { openai };
