# Authentication Flow & Session Persistence

## Overview

The app implements a robust authentication flow with session persistence, ensuring users don't have to go through onboarding every time they restart the app.

## Architecture

### Root Layout Auth Check (`app/_layout.tsx`)

The root layout performs an authentication check on app startup:

1. **Loading State**: Shows splash screen while checking auth status
2. **Session Check**: Queries Supabase for existing session
3. **Profile Verification**: Ensures user has completed onboarding
4. **Smart Routing**: Redirects to appropriate screen based on auth state

## Flow Diagram

```
App Starts
    ↓
Show Splash Screen ("Cargando...")
    ↓
Check Supabase Session
    ↓
    ├─ No Session → Redirect to Onboarding
    ↓
    └─ Session Exists
        ↓
        Query profiles table
        ↓
        ├─ No Profile / Missing display_name → Redirect to Onboarding
        ↓
        └─ Profile Complete → Redirect to Main Tabs
```

## Implementation Details

### 1. **Auth Check Function**

```typescript
const checkAuthStatus = async () => {
  try {
    // Check for existing session
    const { data: { session }, error: sessionError } = 
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    // No session = new user
    if (!session) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // Verify profile exists and is complete
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, birth_date, zodiac_sign')
      .eq('id', session.user.id)
      .single();

    // Missing profile = incomplete onboarding
    if (profileError || !profile || !profile.display_name) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // All good = go to main app
    router.replace('/(tabs)');
  } catch (error) {
    console.error('Auth check error:', error);
    router.replace('/(auth)/onboarding');
  }
};
```

### 2. **Splash Screen**

While checking auth status, users see:
- 🌙 Moon icon
- "Sueños" title in gold
- Loading spinner
- "Cargando..." text

**Design:**
- Dark gradient background
- Centered layout
- Mystic theme consistent with app

### 3. **Session Persistence**

Sessions are automatically persisted using `expo-secure-store`:

```typescript
// In src/services/supabase.ts
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Benefits:**
- Encrypted storage on device
- Automatic token refresh
- Survives app restarts
- Secure and compliant

## User Scenarios

### Scenario 1: New User
1. Opens app for first time
2. Sees splash screen briefly
3. No session found
4. Redirected to onboarding
5. Completes onboarding
6. Session created + profile inserted
7. Navigates to main tabs

### Scenario 2: Returning User
1. Opens app
2. Sees splash screen briefly
3. Session found in secure storage
4. Profile verified in database
5. **Directly to main tabs** (skips onboarding)

### Scenario 3: Incomplete Onboarding (Edge Case)
1. User started onboarding but didn't complete
2. Session exists but profile is missing/incomplete
3. Redirected back to onboarding
4. Can complete the process

### Scenario 4: Session Expired
1. User hasn't opened app in a long time
2. Session expired
3. Treated as new user
4. Redirected to onboarding

## User Greeting

The chat screen (`app/(tabs)/index.tsx`) displays user info in the header:

```typescript
<Text style={styles.headerTitle}>{t('chat.header')}</Text>
<Text style={styles.headerSubtitle}>
  {userProfile ? `${userProfile.display_name} • ${userProfile.zodiac_sign}` : ''}
</Text>
```

**Example:**
```
Luna - Guía Onírica
María • Escorpio
```

## Edge Cases Handled

### 1. **Session Exists, Profile Missing**
- **Cause**: Database error during onboarding
- **Solution**: Redirect to onboarding to complete profile creation

### 2. **Network Error During Auth Check**
- **Cause**: No internet connection
- **Solution**: Catch error, redirect to onboarding (safe default)

### 3. **Corrupted Session Data**
- **Cause**: Storage corruption or tampering
- **Solution**: Error caught, redirect to onboarding

### 4. **Profile Incomplete (Missing Fields)**
- **Cause**: Partial onboarding completion
- **Solution**: Check for `display_name` existence, redirect if missing

## Security Considerations

### ✅ Secure Storage
- Sessions stored in encrypted `expo-secure-store`
- Not accessible to other apps
- Cleared on app uninstall

### ✅ Row Level Security (RLS)
- Users can only access their own profile
- Enforced at database level
- Even with valid session, can't read other users' data

### ✅ Anonymous Auth
- No email/password required initially
- Each user gets unique UUID
- Can be upgraded to permanent account later

### ✅ Token Refresh
- Access tokens automatically refreshed
- No manual intervention needed
- Seamless user experience

## Testing

### Test Case 1: First Launch
```bash
1. Clear app data / reinstall app
2. Launch app
3. Should see splash → onboarding
```

### Test Case 2: Second Launch
```bash
1. Complete onboarding
2. Close app completely
3. Reopen app
4. Should see splash → main tabs (skip onboarding)
```

### Test Case 3: Incomplete Onboarding
```bash
1. Start onboarding but don't complete
2. Close app
3. Reopen app
4. Should see splash → onboarding again
```

### Test Case 4: Manual Logout (Future)
```bash
1. Add logout button
2. Call supabase.auth.signOut()
3. Reopen app
4. Should see onboarding
```

## Performance

- **Auth check**: ~200-500ms (network dependent)
- **Splash screen**: Minimum visible time ensures smooth UX
- **No blocking**: UI remains responsive
- **Optimized queries**: Only fetch necessary profile fields

## Future Enhancements

- **Biometric Auth**: Face ID / Touch ID for re-authentication
- **Account Upgrade**: Convert anonymous → email/social login
- **Multi-Device Sync**: Same account on multiple devices
- **Offline Mode**: Cache profile data for offline access
- **Session Timeout**: Configurable session duration
- **Force Logout**: Admin ability to invalidate sessions

## Troubleshooting

### Issue: Always redirects to onboarding
**Cause**: Session not persisting
**Solution**: 
1. Check `.env` has correct Supabase credentials
2. Verify `expo-secure-store` is installed
3. Check device storage permissions

### Issue: Splash screen stuck
**Cause**: Network timeout or database error
**Solution**:
1. Check internet connection
2. Verify Supabase is accessible
3. Check database schema (profiles table exists)

### Issue: Profile not found after onboarding
**Cause**: Database insert failed
**Solution**:
1. Check Supabase logs for errors
2. Verify RLS policies allow insert
3. Ensure all required fields are provided

## Database Requirements

For auth flow to work, ensure:

```sql
-- Profiles table must exist
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

-- RLS policies must allow user operations
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Summary

The authentication flow ensures:
- ✅ Seamless user experience (no repeated onboarding)
- ✅ Secure session management
- ✅ Proper error handling
- ✅ Edge case coverage
- ✅ Fast and responsive
- ✅ Privacy-focused

Users only see onboarding once, then go straight to the main app on subsequent launches.
