# Database Migration - Add Premium & Usage Tracking

## Issue
The app requires `is_premium` and `interpretation_count` columns in the `profiles` table for the paywall feature.

## Migration SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Add premium and usage tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interpretation_count INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE public.profiles
SET 
  is_premium = FALSE,
  interpretation_count = 0
WHERE is_premium IS NULL OR interpretation_count IS NULL;

-- Verify the migration
SELECT 
  id,
  display_name,
  is_premium,
  interpretation_count,
  created_at
FROM public.profiles
LIMIT 5;
```

## Complete Schema

After migration, your `profiles` table should have:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  zodiac_sign TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  interpretation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Verification

After running the migration, verify in Supabase Dashboard:
1. Go to Table Editor → profiles
2. Check that `is_premium` and `interpretation_count` columns exist
3. All existing users should have `is_premium = false` and `interpretation_count = 0`

## Rollback (if needed)

```sql
-- Remove the columns (only if you need to rollback)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS is_premium,
DROP COLUMN IF EXISTS interpretation_count;
```
