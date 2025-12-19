# MarqenConnect Mobile

Mobile version of MarqenConnect built with React + Capacitor for Android/iOS.

## Features

- 📱 Fully responsive mobile UI
- 🎨 Same design language as desktop (dark theme, yellow accent)
- 📊 Task board with status filters
- 💬 General & Project chat
- 📅 Events calendar
- 👥 Team management (admin only)
- ⚙️ Settings & profile management

## Setup

### Prerequisites

- Node.js 18+
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Installation

```bash
cd mobile
npm install
```

### Development

Run in browser:
```bash
npm run dev
```

### Build for Android

1. Build the web app:
```bash
npm run build
```

2. Sync with Capacitor:
```bash
npm run cap:sync
```

3. Open in Android Studio:
```bash
npm run cap:open:android
```

4. Build APK from Android Studio:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

### Quick Android Build

```bash
npm run build:android
```

## Project Structure

```
mobile/
├── src/
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point with Capacitor init
│   ├── index.css            # Mobile-optimized styles
│   ├── components/
│   │   ├── mobile/          # Mobile-specific components
│   │   │   ├── MobileHeader.tsx
│   │   │   └── BottomNavigation.tsx
│   │   └── ui/              # Shared UI components
│   ├── pages/
│   │   ├── MobileAuth.tsx       # Login screen
│   │   ├── MobileHome.tsx       # Main navigation wrapper
│   │   ├── MobileTaskBoard.tsx  # Dashboard/Tasks
│   │   ├── MobileGeneralSpace.tsx  # General chat
│   │   ├── MobileProjectSpace.tsx  # Projects & chat
│   │   ├── MobileEvents.tsx     # Events calendar
│   │   ├── MobileEquipe.tsx     # Team management
│   │   └── MobileSettings.tsx   # Settings
│   ├── lib/                 # Shared utilities
│   ├── config/              # API configuration
│   └── services/            # Activity tracking
├── capacitor.config.json    # Capacitor configuration
├── package.json
└── vite.config.ts
```

## Design System

### Colors (Same as Desktop)
- Background: `#0a0a0a` (nearly black)
- Primary: `#E1F700` (yellow/lime)
- Card: `#1a1a1a`
- Border: `#3b3b3b`

### Mobile-Specific Features
- Bottom navigation instead of sidebar
- Larger touch targets (min 44px)
- Safe area insets for notched devices
- iOS-style blur headers
- Haptic feedback on navigation
- Pull-to-refresh on lists
- Swipe gestures

## Capacitor Plugins Used

- `@capacitor/app` - App lifecycle management
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - Splash screen

## Building Release APK

1. Update version in `package.json`
2. Build and sync:
   ```bash
   npm run build:android
   ```
3. Open Android Studio and generate signed APK/Bundle
