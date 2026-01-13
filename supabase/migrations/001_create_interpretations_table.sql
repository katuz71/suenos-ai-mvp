-- Создание таблицы для хранения толкований снов
CREATE TABLE IF NOT EXISTS interpretations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dream_text TEXT NOT NULL,
  interpretation_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Создание индекса для быстрого поиска по пользователю и дате
CREATE INDEX IF NOT EXISTS idx_interpretations_user_created ON interpretations(user_id, created_at DESC);

-- Включение RLS (Row Level Security)
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;

-- Политика для пользователей видеть только свои толкования
CREATE POLICY "Users can view their own interpretations" ON interpretations
  FOR SELECT USING (auth.uid() = user_id);

-- Политика для пользователей создавать только свои толкования
CREATE POLICY "Users can create their own interpretations" ON interpretations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для пользователей обновлять только свои толкования
CREATE POLICY "Users can update their own interpretations" ON interpretations
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика для пользователей удалять только свои толкования
CREATE POLICY "Users can delete their own interpretations" ON interpretations
  FOR DELETE USING (auth.uid() = user_id);
