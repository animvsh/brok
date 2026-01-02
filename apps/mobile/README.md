# Brok Mobile App - Setup & Running Guide

This guide will help you set up and run the Brok mobile app on iOS, Android, or Web.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **npm** or **yarn**
   - Usually comes with Node.js
   - Check: `npm --version`

3. **Expo CLI** (globally installed)
   ```bash
   npm install -g expo-cli
   # OR
   npm install -g @expo/cli
   ```

### Platform-Specific Requirements

#### For iOS Development:
- **macOS** (required)
- **Xcode** (latest version from App Store)
- **iOS Simulator** (comes with Xcode)
- **CocoaPods** (for native dependencies)
  ```bash
  sudo gem install cocoapods
  ```

#### For Android Development:
- **Android Studio** (latest version)
- **Android SDK** (installed via Android Studio)
- **Android Emulator** (set up via Android Studio)
- **Java Development Kit (JDK)** (version 17 or higher)

#### For Web Development:
- Any modern browser (Chrome, Firefox, Safari, Edge)

## Setup Instructions

### 1. Navigate to Mobile Directory

```bash
cd apps/mobile
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages
- Run `patch-package` automatically (postinstall script) to apply patches

**Note:** If you encounter issues, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Environment Variables

Create a `.env` file in the `apps/mobile` directory:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: API endpoint for web backend
# EXPO_PUBLIC_API_URL=http://localhost:4000
```

**Getting Supabase Credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" → `EXPO_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Note:** The app has fallback values in `src/lib/supabase.js`, but you should set your own.

### 4. Start the Development Server

#### Option A: Using Expo CLI (Recommended)

```bash
npx expo start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Show a QR code for testing on physical devices

#### Option B: Using npm scripts (if configured)

```bash
npm start
```

### 5. Run on Different Platforms

Once the dev server is running, you can:

#### **iOS Simulator** (macOS only)
```bash
# Press 'i' in the terminal, OR
npx expo start --ios
```

#### **Android Emulator**
```bash
# Press 'a' in the terminal, OR
npx expo start --android
```

**Note:** Make sure your Android emulator is running first:
```bash
# Start emulator from Android Studio, OR
emulator -avd <your_avd_name>
```

#### **Web Browser**
```bash
# Press 'w' in the terminal, OR
npx expo start --web
```

#### **Physical Device**

1. **iOS:**
   - Install "Expo Go" from App Store
   - Scan the QR code from terminal/browser
   - Or use the tunnel URL

2. **Android:**
   - Install "Expo Go" from Google Play
   - Scan the QR code from terminal/browser
   - Or use the tunnel URL

**For Physical Device Testing:**
- Make sure your phone and computer are on the same Wi-Fi network
- Or use tunnel mode: `npx expo start --tunnel`

## Development Commands

### Clear Cache and Restart

If you encounter issues, try clearing the cache:

```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear all caches
rm -rf node_modules .expo caches
npm install
npx expo start --clear
```

### Run in Production Mode

```bash
npx expo start --no-dev --minify
```

### Check for Updates

```bash
npx expo install --check
```

## Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## Troubleshooting

### Common Issues

#### 1. **Metro Bundler Port Already in Use**
```bash
# Kill the process using port 8081
lsof -ti:8081 | xargs kill -9
# OR change the port
npx expo start --port 8082
```

#### 2. **iOS Build Errors**
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

#### 3. **Android Build Errors**
- Make sure Android SDK is properly configured
- Check that `ANDROID_HOME` environment variable is set
- Verify Java version: `java -version` (should be 17+)

#### 4. **Font Loading Issues**
The app uses custom fonts. If fonts don't load:
- Check that fonts are properly installed
- Clear cache and restart: `npx expo start --clear`

#### 5. **Supabase Connection Issues**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure network connectivity

#### 6. **Patch Package Errors**
If patches fail to apply:
```bash
npx patch-package
```

### Reset Everything

If nothing works, do a complete reset:

```bash
# Remove all generated files
rm -rf node_modules .expo caches ios/build android/build android/app/build

# Reinstall
npm install

# Clear watchman (if installed)
watchman watch-del-all

# Start fresh
npx expo start --clear
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── app/              # Expo Router routes
│   ├── components/       # React components
│   ├── lib/              # Libraries (Supabase)
│   └── utils/            # Utilities (auth, hooks)
├── assets/               # Images, fonts, etc.
├── polyfills/            # Platform-specific polyfills
├── patches/              # Package patches
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── metro.config.js       # Metro bundler config
```

## Key Features

- **Expo Router**: File-based routing
- **Supabase**: Authentication and database
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **React Native Reanimated**: Animations
- **TypeScript**: Type safety

## Next Steps

1. **Set up Supabase:**
   - Run the database schema: `supabase-schema.sql` and `supabase-schema-v2.sql`
   - Configure authentication providers

2. **Connect to Backend:**
   - The mobile app can connect to the web API at `apps/web`
   - Make sure the web server is running if you need API features

3. **Configure Push Notifications:**
   - Set up Expo push notification certificates
   - Configure in `app.json` if needed

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

## Support

If you encounter issues not covered here:
1. Check the Expo forums
2. Review the error logs in the terminal
3. Check browser console (for web) or device logs (for native)

