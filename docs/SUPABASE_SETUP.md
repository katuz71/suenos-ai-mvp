# Supabase Setup Guide

## Database Schema

Create the following table in your Supabase project:

```sql
-- Create profiles table
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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Get your credentials from:
   - Supabase Dashboard → Settings → API
   - Copy "Project URL" and "anon/public" key

## Authentication Flow

The app uses **anonymous authentication** for the onboarding flow:

1. User enters name and birth date
2. App calls `supabase.auth.signInAnonymously()`
3. Creates a session with a unique user ID
4. Inserts profile data into `profiles` table
5. Session persists using `expo-secure-store`

## Zodiac Calculation

The `calculateZodiac()` helper automatically determines the user's zodiac sign based on their birth date:

- **Aries**: Mar 21 - Apr 19
- **Tauro**: Apr 20 - May 20
- **Géminis**: May 21 - Jun 20
- **Cáncer**: Jun 21 - Jul 22
- **Leo**: Jul 23 - Aug 22
- **Virgo**: Aug 23 - Sep 22
- **Libra**: Sep 23 - Oct 22
- **Escorpio**: Oct 23 - Nov 21
- **Sagitario**: Nov 22 - Dec 21
- **Capricornio**: Dec 22 - Jan 19
- **Acuario**: Jan 20 - Feb 18
- **Piscis**: Feb 19 - Mar 20

## Testing

1. Start the app: `npm start`
2. Complete onboarding with test data:
   - Name: "Test User"
   - Birth Date: "15/03/1995" (auto-formats as you type)
3. Check Supabase Dashboard → Table Editor → profiles
4. Verify the profile was created with correct zodiac sign

## Security Notes

- Anonymous auth allows users to start without email/password
- Each anonymous user gets a unique UUID
- RLS policies ensure users can only access their own data
- Session tokens stored securely using `expo-secure-store` (encrypted on device)

## Future Enhancements

- Convert anonymous users to permanent accounts (email/social login)
- Add profile update functionality
- Store dream entries linked to user profiles
- Implement user preferences and settings
