# Paywall & Monetization Feature

## Overview

The app implements a freemium model with a paywall to monetize dream interpretations. Free users get **1 free interpretation**, then must subscribe to continue.

## Monetization Strategy (from `docs/STRATEGY.md`)

**Decoy Pricing:**
- **Weekly**: $1.99/week (Target) - Selected by default
- **Lifetime**: $39.99 (Anchor) - Makes weekly look cheap
- **Free Trial**: 3 Days (Weekly only)

**Free Tier:**
- 1 free dream interpretation
- After that, paywall appears

**Premium Tier:**
- Unlimited interpretations
- Deep daily horoscope (future)
- Tarot reading (future)
- Dream pattern analysis (future)

## Implementation

### 1. **Paywall Modal** (`app/modal/paywall.tsx`)

**Design:**
- Dark mystic gradient background
- Header: "Desbloquea tu Destino" ✨
- Features list with checkmarks (✅)
- Two pricing cards with decoy strategy
- Large gold CTA button: "Comenzar Periodo de Prueba"
- Footer: Restore Purchases, Terms, Privacy

**Pricing Cards:**
- **Lifetime ($39.99)**: Greyed out, less prominent (anchor)
- **Weekly ($1.99)**: Highlighted in GOLD with badge "Prueba Gratis 3 Días"

**User Flow:**
1. User selects plan (weekly selected by default)
2. Clicks "Comenzar Periodo de Prueba"
3. Loading state: "Conectando con la tienda..."
4. Mock purchase updates `is_premium = true` in database
5. Modal closes, user can continue chatting

### 2. **Usage Tracking** (`src/services/supabase.ts`)

**Functions:**

**`checkUsageLimit(userId)`**
```typescript
Returns: {
  canUse: boolean,      // Can user make another interpretation?
  isPremium: boolean,   // Is user premium?
  usageCount: number    // How many interpretations used
}

Logic:
- If isPremium: Always return canUse = true
- If free: canUse = true only if usageCount < 1
```

**`incrementUsageCount(userId)`**
```typescript
- Increments interpretation_count by 1
- Called AFTER successful OpenAI API response
```

### 3. **Chat Integration** (`app/(tabs)/index.tsx`)

**Before sending message:**
1. Check `checkUsageLimit(userId)`
2. If `canUse = false` → Open paywall modal
3. If `canUse = true` → Proceed with interpretation
4. After successful response → `incrementUsageCount(userId)`

**Flow:**
```
User types dream → Clicks send
  ↓
Check usage limit
  ↓
Free user with 1+ interpretations?
  ↓ YES
Show paywall modal
  ↓ NO
Call OpenAI API
  ↓
Increment usage count
  ↓
Show response with typewriter effect
```

### 4. **Database Schema**

**New columns in `profiles` table:**
```sql
is_premium BOOLEAN DEFAULT FALSE
interpretation_count INTEGER DEFAULT 0
```

**Migration for existing users:**
```sql
ALTER TABLE public.profiles
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN interpretation_count INTEGER DEFAULT 0;
```

## Mock Purchase (MVP)

For MVP speed, the subscription button performs a **mock purchase**:

```typescript
// TODO: Integrate RevenueCat here
const { error } = await supabase
  .from('profiles')
  .update({ is_premium: true })
  .eq('id', session.user.id);
```

**Production Integration:**
- Replace with RevenueCat SDK
- Handle real App Store / Google Play purchases
- Validate receipts server-side
- Sync premium status with Supabase

## UI/UX Improvements

**Fixed in this update:**
- ✅ Added top padding (32px) to chat messages list
- ✅ First message no longer cut off by header

## Testing the Paywall

1. **Complete onboarding** to create a profile
2. **Send first dream** → Should work (free interpretation)
3. **Try to send second dream** → Paywall appears
4. **Click "Comenzar Periodo de Prueba"**
5. **Wait for loading** → "Conectando con la tienda..."
6. **Modal closes** → User is now premium
7. **Send unlimited dreams** → No more paywall

## Verification

Check in Supabase Dashboard:
```sql
SELECT 
  display_name, 
  is_premium, 
  interpretation_count 
FROM profiles;
```

Expected results:
- After 1st interpretation: `interpretation_count = 1`, `is_premium = false`
- After paywall: `is_premium = true`
- After 2nd interpretation: `interpretation_count = 2`, `is_premium = true`

## Revenue Optimization

**Decoy Effect:**
- Lifetime ($39.99) makes weekly ($1.99) seem like a bargain
- Most users will choose weekly with free trial
- 3-day trial reduces friction, increases conversions

**Conversion Funnel:**
1. User gets hooked with 1 free interpretation
2. Wants more → Sees paywall
3. Weekly with trial looks cheap vs lifetime
4. Low commitment → High conversion
5. After trial → Recurring revenue

**Expected Metrics:**
- Free → Paywall: ~80% of users
- Paywall → Subscribe: ~15-25% (industry standard)
- Trial → Paid: ~40-60% retention

## Future Enhancements

- **RevenueCat Integration**: Real payment processing
- **Restore Purchases**: Sync across devices
- **Subscription Management**: Cancel, upgrade, downgrade
- **Promotional Offers**: Discounts, special pricing
- **Usage Analytics**: Track conversion rates
- **A/B Testing**: Test different pricing strategies
- **Rewarded Video Ads**: Alternative for free users (watch ad = 1 interpretation)

## Language & Tone

**Spanish Only:**
- "Desbloquea tu Destino" (Unlock your Destiny)
- "Interpretaciones Ilimitadas" (Unlimited Interpretations)
- "Comenzar Periodo de Prueba" (Start Trial Period)
- "Conectando con la tienda" (Connecting to store)

**No "AI" mentions:**
- Focus on mystical benefits
- "Guía Personalizada de Luna" (not "AI Assistant")
- "Análisis de Patrones" (not "AI Analysis")

## Cost Analysis

**User Acquisition Cost (UAC):** ~$2-5 (industry avg)
**Lifetime Value (LTV):**
- Weekly subscriber: $1.99 × 4 weeks × 3 months avg = $23.88
- LTV/UAC ratio: 4.8x - 11.9x ✅ Profitable

**Break-even:**
- Need ~2-3 weeks of subscription to cover UAC
- Free trial is 3 days, so most paying users are profitable
