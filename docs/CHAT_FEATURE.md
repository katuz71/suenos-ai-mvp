# Luna Chat Feature - Dream Interpretation

## Overview

The main screen (`app/(tabs)/index.tsx`) is a chat interface where users interact with Luna, the mystical dream interpreter powered by OpenAI's GPT-4o-mini.

## Features Implemented

### 1. **Custom Chat UI with Mystic Styling**

**Design Elements:**
- **Background**: Deep purple gradient (#120d26 → #1a0b2e)
- **User Bubbles**: Dark gold (#B8941F) with rounded corners
- **Luna Bubbles**: Glassmorphism effect (transparent purple with violet border)
- **Header**: "Luna - Guía Onírica" with user name and zodiac sign
- **Input**: Rounded text input with placeholder "Cuéntame tu sueño..."

**Visual Hierarchy:**
- Luna messages appear on the left with 🌙 icon
- User messages appear on the right in gold bubbles
- Clear visual distinction between sender types

### 2. **Typewriter Effect**

Luna's responses appear character-by-character with a typewriter effect:
- Speed: 20ms per character
- Animated cursor (▌) during typing
- Smooth, magical appearance
- Auto-scroll to keep latest message visible

### 3. **Loading States**

**"Consultando a los astros..."**
- Pulsing ✨ animation while waiting for API response
- Prevents user input during processing
- Clear visual feedback

### 4. **Profile Context Integration**

The chat automatically loads the user's profile from Supabase:
- Display name
- Zodiac sign
- Birth date

This context is sent to OpenAI to personalize Luna's responses.

### 5. **OpenAI Integration**

**Service**: `src/services/openai.ts`

**System Prompt** (from `docs/LUNA_PERSONA.md`):
```
You are Luna, a digital entity connecting the user's subconscious to the stars.
- Spanish ONLY
- Mystical but grounded tone
- Use metaphors (water, fire, moon phases)
- ALWAYS end with a question to provoke engagement
- Reference user's zodiac sign when relevant
```

**Model**: `gpt-4o-mini` (cost-effective)
**Temperature**: 0.8 (creative but coherent)
**Max Tokens**: 500 (concise responses)

### 6. **Context Injection**

Each API call includes:
```typescript
USER CONTEXT:
- Name: [user's name]
- Zodiac Sign: [user's zodiac]
```

This allows Luna to personalize responses like:
- "Como Escorpio, sientes esto profundamente..."
- "[Name], el agua en tu sueño representa..."

## User Flow

1. **Screen Opens**
   - Loads user profile from Supabase
   - Displays welcome message from Luna
   - Shows user name + zodiac in header

2. **User Types Dream**
   - Input field: "Cuéntame tu sueño..."
   - Max 500 characters
   - Multiline support

3. **User Sends Message**
   - Message appears immediately in gold bubble
   - Input clears
   - Loading state: "Consultando a los astros..."

4. **Luna Responds**
   - API call to OpenAI with context
   - Response appears with typewriter effect
   - Ends with engaging question
   - Auto-scrolls to show full response

5. **Conversation Continues**
   - User can reply
   - Context maintained in conversation
   - Smooth, magical UX

## Technical Implementation

### State Management
```typescript
- messages: Message[] (chat history)
- inputText: string (current input)
- isLoading: boolean (API call in progress)
- isTyping: boolean (typewriter effect active)
- userProfile: UserProfile (from Supabase)
```

### Key Functions

**`loadUserProfile()`**
- Fetches user data from Supabase
- Called on component mount

**`typewriterEffect(text, messageId)`**
- Animates text appearance character-by-character
- Updates message state in real-time

**`handleSend()`**
- Adds user message to chat
- Calls OpenAI API with context
- Handles response with typewriter effect

**`interpretDream(message, profile)`**
- OpenAI service function
- Injects system prompt + user context
- Returns Luna's interpretation

## Environment Setup

Add to `.env`:
```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## Error Handling

- **API Failure**: Shows error message in Spanish
- **No Profile**: Waits for profile to load before enabling chat
- **Network Issues**: Graceful error message from Luna

## Language & Tone

**Strictly Spanish:**
- All UI text in Spanish
- All Luna responses in Spanish
- No mention of "AI", "bot", "GPT"

**Mystic Vocabulary:**
- "Guía Onírica" (Dream Guide)
- "Consultando a los astros" (Consulting the stars)
- "El universo tiene para ti" (The universe has for you)

## Testing

1. Complete onboarding to create profile
2. Navigate to main screen
3. Type a dream: "Soñé que volaba sobre el océano"
4. Watch typewriter effect
5. Verify Luna responds in Spanish with personalized context
6. Check that response ends with a question

## Future Enhancements

- Save conversation history to Supabase
- Add voice input for dreams
- Image generation for dream symbols (DALL-E 3)
- Dream journal with past interpretations
- Share interpretations feature
- Multi-turn conversation context (chat history)

## Cost Optimization

**GPT-4o-mini pricing** (as of 2024):
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**Average cost per interpretation:**
- System prompt: ~200 tokens
- User message: ~50-100 tokens
- Response: ~300 tokens
- **Total: ~$0.0003 per interpretation**

Very cost-effective for MVP testing!
