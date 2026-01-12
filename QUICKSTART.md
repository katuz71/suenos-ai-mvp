# 🚀 Quick Start Guide - Sueños AI

## Running the App

### Start Development Server
```bash
npm start
```

This will open the Expo development tools. You can then:
- Press `a` for Android
- Press `i` for iOS (macOS only)
- Press `w` for Web
- Scan QR code with Expo Go app on your phone

### Platform-Specific Commands
```bash
npm run android  # Run on Android emulator/device
npm run ios      # Run on iOS simulator (macOS only)
npm run web      # Run in web browser
```

## 🎯 Testing the Onboarding Flow

1. **Start the app** - You'll land on the onboarding screen
2. **Step 1: Introduction**
   - See Luna's welcome message
   - Tap "Comenzar" to continue
3. **Step 2: User Input**
   - Enter your name (e.g., "María")
   - Enter birth date in DD/MM/AAAA format (e.g., "15/03/1995")
   - Tap "Continuar"
4. **Step 3: Animation**
   - Watch the cosmic loading animation
   - See messages: "Analizando tu carta astral..."
   - Automatically redirects to main app after 4 seconds
5. **Main App**
   - Navigate between tabs: Inicio, Sueños, Perfil

## 🎨 Design Features to Notice

### Mystic Color Palette
- **Deep purple gradient backgrounds** (#120d26 → #1a0b2e)
- **Gold accent buttons** (#D4AF37)
- **Cream text** (#F5F5DC) for readability

### Animations
- **Fade-in effects** on screen transitions
- **Scale animations** for smooth entry
- **Pulsing cosmic circle** during loading
- **Rotating border** for mystical effect

### Components
- **MysticButton**: Gold-themed with filled/outlined variants
- **MysticInput**: Translucent dark inputs with validation

## 📱 App Flow

```
Index (/) 
  ↓
Onboarding (/auth/onboarding)
  ↓ (after animation)
Main Tabs (/(tabs))
  ├── Home (index)
  ├── Dreams (dreams)
  └── Profile (profile)
```

## 🐛 Troubleshooting

### Dependency Issues
If you encounter peer dependency warnings:
```bash
npm install --legacy-peer-deps
```

### Clear Cache
```bash
npx expo start -c
```

### Reset Project
```bash
rm -rf node_modules
npm install
```

## 📝 Next Steps

1. **Test on physical device** using Expo Go app
2. **Verify animations** are smooth on all platforms
3. **Test input validation** with various date formats
4. **Check navigation flow** from onboarding to tabs

## 🎭 Luna Persona Testing

When testing, notice how Luna:
- Uses warm, welcoming Spanish language
- Incorporates mystical terminology
- Creates anticipation with the loading animation
- Sets the tone for the entire app experience

## 🔧 Development Tips

- **Hot Reload**: Changes auto-refresh in development
- **Debug Menu**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- **Inspect Element**: Available in web version
- **Console Logs**: Visible in terminal where you ran `npm start`

---

**Ready to experience the magic? Run `npm start` now!** ✨🌙
