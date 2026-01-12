# Internationalization (i18n) Setup

## Overview

The app uses `i18next` and `react-i18next` for internationalization, making it easy to support multiple languages while maintaining a single codebase.

## Architecture

### File Structure

```
src/i18n/
├── index.ts           # i18n initialization and configuration
└── locales/
    ├── es.ts          # Spanish translations (default)
    └── en.ts          # English translations
```

### Configuration

**`src/i18n/index.ts`**
- Initializes i18next with React integration
- Sets default language to Spanish (`es`)
- Configures fallback language
- Imports all locale files

**Default Language:** Spanish (`es`)
**Supported Languages:** Spanish (`es`), English (`en`)

## Usage

### In Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('onboarding.welcome')}</Text>
  );
}
```

### Translation Keys Structure

All translations are organized by feature/screen:

```typescript
{
  translation: {
    onboarding: {
      welcome: 'Bienvenido a Sueños',
      subtitle: 'Descubre el significado oculto de tus sueños',
      // ... more keys
    },
    chat: {
      header: 'Luna - Guía Onírica',
      welcomeMessage: '🌙 Hola, soy Luna...',
      // ... more keys
    },
    paywall: {
      header: 'Desbloquea tu Destino',
      features: {
        unlimitedInterpretations: 'Interpretaciones Ilimitadas',
        // ... more keys
      },
      // ... more keys
    },
    tabs: {
      home: 'Inicio',
      dreams: 'Sueños',
      profile: 'Perfil',
    },
    common: {
      close: '✕',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
    },
  },
}
```

## Refactored Components

All hardcoded text has been moved to i18n files:

### ✅ Onboarding Screen (`app/(auth)/onboarding.tsx`)
- Welcome messages
- Form labels and placeholders
- Error messages
- Button text
- Animation text

### ✅ Chat Screen (`app/(tabs)/index.tsx`)
- Header title
- Welcome message from Luna
- Input placeholder
- Loading text
- Error messages

### ✅ Paywall Modal (`app/modal/paywall.tsx`)
- Header and subtitle
- Feature list
- Pricing cards
- CTA button
- Footer links
- Disclaimer text

### ✅ Tab Layout (`app/(tabs)/_layout.tsx`)
- Tab titles (Home, Dreams, Profile)

## Adding a New Language

1. **Create locale file:**
   ```bash
   touch src/i18n/locales/fr.ts
   ```

2. **Add translations:**
   ```typescript
   // src/i18n/locales/fr.ts
   export default {
     translation: {
       onboarding: {
         welcome: 'Bienvenue à Rêves',
         // ... all keys from es.ts
       },
       // ... all sections
     },
   };
   ```

3. **Import in index.ts:**
   ```typescript
   import fr from './locales/fr';
   
   i18n.use(initReactI18next).init({
     resources: {
       es,
       en,
       fr, // Add new language
     },
     // ...
   });
   ```

4. **Change language at runtime:**
   ```typescript
   import i18n from '../src/i18n';
   
   i18n.changeLanguage('fr');
   ```

## Language Detection

Currently, the app defaults to Spanish. To implement automatic language detection:

```typescript
import * as Localization from 'expo-localization';

i18n.use(initReactI18next).init({
  lng: Localization.locale.split('-')[0], // 'en-US' -> 'en'
  fallbackLng: 'es',
  // ...
});
```

## Best Practices

### 1. **Nested Keys**
Use nested objects for better organization:
```typescript
// Good
t('paywall.features.unlimitedInterpretations')

// Avoid
t('paywallFeaturesUnlimitedInterpretations')
```

### 2. **Interpolation**
For dynamic values:
```typescript
// In locale file
greeting: 'Hola, {{name}}'

// In component
t('greeting', { name: userProfile.display_name })
```

### 3. **Pluralization**
For countable items:
```typescript
// In locale file
dreams: 'sueño',
dreams_plural: 'sueños'

// In component
t('dreams', { count: 5 }) // "5 sueños"
```

### 4. **Common Strings**
Reuse common strings across the app:
```typescript
common: {
  close: '✕',
  loading: 'Cargando...',
  error: 'Error',
  success: 'Éxito',
}
```

## Testing Translations

### 1. **Switch Language in Dev**
```typescript
// Add to any component for testing
import i18n from '../../src/i18n';

<Button onPress={() => i18n.changeLanguage('en')} />
```

### 2. **Check Missing Keys**
i18next will log warnings for missing translation keys in development.

### 3. **Verify All Screens**
- Onboarding flow
- Chat interface
- Paywall modal
- Tab navigation
- Error messages

## Current Language Support

| Language | Code | Status | Completion |
|----------|------|--------|------------|
| Spanish  | `es` | ✅ Active | 100% |
| English  | `en` | ✅ Ready | 100% |

## Future Enhancements

- **Language Selector**: Add UI to switch languages
- **Persistent Language**: Save user's language preference
- **RTL Support**: Add right-to-left language support (Arabic, Hebrew)
- **Regional Variants**: Spanish (Spain) vs Spanish (Mexico)
- **Automatic Detection**: Use device language as default
- **Translation Management**: Use translation management platform (Lokalise, Crowdin)

## Migration Notes

All hardcoded Spanish text has been successfully migrated to `src/i18n/locales/es.ts`. The app is now fully internationalized and ready for multi-language support.

### Before:
```typescript
<Text>Bienvenido a Sueños</Text>
```

### After:
```typescript
const { t } = useTranslation();
<Text>{t('onboarding.welcome')}</Text>
```

## Performance

- i18next is lightweight (~10KB gzipped)
- Translations are loaded synchronously on app start
- No runtime performance impact
- Locale files are tree-shakeable

## Maintenance

When adding new features:
1. Add translation keys to ALL locale files (es.ts, en.ts)
2. Use `t()` function in components
3. Test in both languages
4. Update this documentation if adding new sections
