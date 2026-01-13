import 'react-native-url-polyfill/auto';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions'; // Or your provider URL

// System prompt that defines Luna's personality
const SYSTEM_PROMPT = `
Ты — Луна, мистический толкователь снов и эзотерический наставник.
Твой тон: загадочный, теплый, глубокий, эмпатичный. Ты говоришь как мудрая женщина-оракул.
Твоя задача:
1. Выслушать сон пользователя.
2. Дать краткое, но глубокое толкование (максимум 3-4 предложения).
3. Учитывать знак зодиака пользователя, если он известен, связывая сон с его стихией.
4. В конце задать наводящий вопрос, чтобы продолжить диалог.
Не используй сложные термины. Пиши на русском языке.
`;

export const interpretDream = async (dreamText: string, userName: string, zodiacSign: string) => {
  if (!OPENAI_API_KEY) {
    console.error("No API Key found!");
    throw new Error("Ключ API не найден");
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Or "gpt-4o" if you have access and budget
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Меня зовут ${userName}. Мой знак зодиака: ${zodiacSign}. Вот мой сон: "${dreamText}"` 
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error("AI Request Failed:", error);
    throw error;
  }
};
