# 🌙 Sueños AI - Dream Interpretation App

A mystical dream interpretation app powered by AI, built with React Native, Expo, and TypeScript.

## ✨ Features

- **Magical Onboarding Flow**: Multi-step onboarding with Luna, your cosmic guide
- **Mystic Design System**: Deep purple gradients, gold accents, premium aesthetic
- **Personalized Experience**: Astrological integration based on birth date
- **Smooth Animations**: Engaging transitions and loading states

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web
```

## 📁 Project Structure

```
suenos-ai-mvp/
├── app/
│   ├── (auth)/
│   │   └── onboarding.tsx       # Onboarding flow
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # Home screen
│   │   ├── dreams.tsx           # Dreams screen
│   │   └── profile.tsx          # Profile screen
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── MysticButton.tsx # Reusable button component
│   │       └── MysticInput.tsx  # Reusable input component
│   └── constants/
│       └── Colors.ts            # Color palette
├── docs/
│   ├── STRATEGY.md              # Product strategy
│   └── LUNA_PERSONA.md          # AI persona guide
└── assets/                      # Images and fonts
```

## 🎨 Design System

### Color Palette
- **Background**: Deep Dark Violet (#120d26 - #1a0b2e)
- **Accent**: Gold/Amber (#D4AF37)
- **Text**: Off-white/Cream (#F5F5DC)

### Components
- `MysticButton`: Gold-themed button with filled/outlined variants
- `MysticInput`: Translucent dark input fields with validation

## 🌟 Onboarding Flow

1. **Introduction**: Luna welcomes the user
2. **User Input**: Collect name and birth date
3. **Animation**: Cosmic loading animation (3-4 seconds)
4. **Redirect**: Navigate to main app

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Animations**: React Native Animated API
- **Gradients**: expo-linear-gradient

## 📱 Screens

- **Onboarding**: Multi-step flow with Luna introduction
- **Home**: Main dashboard (coming soon)
- **Dreams**: Dream journal (coming soon)
- **Profile**: User profile and settings (coming soon)

## 🔮 Luna - AI Persona

Luna is the mystical guide who interprets dreams and connects users with cosmic energy. See `docs/LUNA_PERSONA.md` for full persona details.

## 📄 License

Private - All Rights Reserved

## 🤝 Contributing

This is a private MVP project. Contact the team for contribution guidelines.
