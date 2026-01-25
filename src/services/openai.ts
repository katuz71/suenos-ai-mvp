import { supabase } from './supabase';

// --- DREAM INTERPRETATION (Сны) ---
// Now calls Supabase Edge Function 'interpret-dream'
export const interpretDream = async (
  text: string,
  userContext?: { name: string; zodiac: string },
  isChat: boolean = false
) => {
  if (!text || text.trim().length === 0) {
    throw new Error('El texto del sueño no puede estar vacío.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('interpret-dream', {
      body: {
        dream_text: text,
        user_context: userContext,
        is_chat: isChat
      }
    });

    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(error.message || 'Error de conexión cósmica.');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data; // Returns { interpretation: string, remaining_credits: number, entry: object | null }

  } catch (error: any) {
    console.error('Service Error (Dreams):', error);
    let msg = 'Error de conexión cósmica.';
    if (error.message.includes('Insufficient energy')) {
      msg = 'No tienes suficiente energía.';
    }
    throw new Error(msg);
  }
};

// --- DAILY HOROSCOPE (Гороскоп) ---
export const generateDailyHoroscope = async (
  sign: string,
  name: string
) => {
  if (!sign) throw new Error('Signo requerido');

  try {
    const { data, error } = await supabase.functions.invoke('generate-horoscope', {
      body: { sign, name }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data.horoscope;

  } catch (error) {
    console.error('Service Error (Horoscope):', error);
    throw new Error('Error al leer las estrellas.');
  }
};