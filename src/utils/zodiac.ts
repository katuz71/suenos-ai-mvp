export type ZodiacSign =
  | 'Aries'
  | 'Tauro'
  | 'Géminis'
  | 'Cáncer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Escorpio'
  | 'Sagitario'
  | 'Capricornio'
  | 'Acuario'
  | 'Piscis';

export function calculateZodiac(day: number, month: number): ZodiacSign {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'Aries';
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'Tauro';
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'Géminis';
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'Cáncer';
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'Leo';
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'Virgo';
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'Libra';
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'Escorpio';
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'Sagitario';
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'Capricornio';
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'Acuario';
  } else {
    return 'Piscis';
  }
}

export function formatDateForDB(ddmmyyyy: string): string | null {
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;

  const day = parts[0];
  const month = parts[1];
  const year = parts[2];

  if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
    return null;
  }

  return `${year}-${month}-${day}`;
}
