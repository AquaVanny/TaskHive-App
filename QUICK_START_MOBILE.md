# 🚀 Quick Start - Build Android App

## One-Time Setup (First Time Only)

1. **Install Android Studio**
   - Download: https://developer.android.com/studio
   - Follow installation wizard
   - Install Android SDK (auto-prompted)

## Build & Test (Every Time)

### Option A: Quick Build + Open
```bash
npm run mobile:android
```
Then in Android Studio, click the green **Run** button.

### Option B: Step by Step
```bash
# 1. Build your web app
npm run build

# 2. Sync to Android
npx cap sync

# 3. Open Android Studio
npx cap open android

# 4. Click Run (green play button)
```

## Testing Notifications

1. Install app on your Android phone
2. Open the app
3. **You'll see Android's notification permission dialog** ✅
4. Click "Allow"
5. Done! Notifications will work properly

## That's It! 🎉

Your app is now a real native Android app with proper notification permissions.

---

## Common Commands

```bash
npm run mobile:sync      # Build + sync changes to Android
npm run mobile:android   # Open in Android Studio
npm run mobile:run       # Build, sync, and run on connected device
```

## Need Help?

See `MOBILE_BUILD_GUIDE.md` for detailed instructions.
