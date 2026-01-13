# Supabase Database Setup

## Создание таблицы interpretations

Чтобы создать таблицу для хранения толкований снов, выполните следующие шаги:

### 1. Через веб-интерфейс Supabase:

1. Откройте ваш проект в Supabase Dashboard
2. Перейдите в раздел "SQL Editor"
3. Скопируйте и выполните SQL код из файла `001_create_interpretations_table.sql`

### 2. Через CLI (если установлен):

```bash
# Установка Supabase CLI (если еще не установлен)
npm install -g supabase

# Вход в систему
supabase login

# Выполнение миграции
supabase db push
```

### 3. Структура таблицы:

```sql
CREATE TABLE interpretations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dream_text TEXT NOT NULL,
  interpretation_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 4. Политики безопасности (RLS):

- Пользователи могут видеть только свои толкования
- Пользователи могут создавать только свои толкования
- Пользователи могут обновлять только свои толкования
- Пользователи могут удалять только свои толкования

### 5. Индексы:

Создан индекс `idx_interpretations_user_created` для быстрого поиска по пользователю и дате.

## Проверка

После создания таблицы проверьте, что она работает корректно в приложении:
1. Войдите в приложение
2. Отправьте сон на толкование
3. Проверьте, что толкование сохранилось в базе данных
4. Проверьте, что история снов отображается корректно
