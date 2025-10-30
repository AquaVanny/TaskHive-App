# TaskHive Mobile App - Build & Deployment Guide 📱

## ✅ What's Been Set Up

Your TaskHive app is now a **native Android app** with proper notification permissions using Capacitor!

### Key Changes Made:
1. ✅ Installed Capacitor & Push Notifications plugin
2. ✅ Changed routing from `BrowserRouter` to `HashRouter` (required for mobile)
3. ✅ Added native notification service with Android permissions
4. ✅ Configured Android manifest with `POST_NOTIFICATIONS` permission
5. ✅ Integrated notification initialization in your app

---

## 🚀 How to Build Your Android App

### Prerequisites
- **Android Studio** (Download from: https://developer.android.com/studio)
- **Java JDK 17** (bundled with Android Studio)

### Step 1: Build the Web Assets
```bash
npm run build
```

### Step 2: Sync with Android Project
```bash
npx cap sync android
```

### Step 3: Open in Android Studio
```bash
npm run mobile:android
```

Or manually:
```bash
npx cap open android
```

### Step 4: Build APK in Android Studio
1. Wait for Gradle sync to complete
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK will be created in: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Testing on Your Phone

### Method 1: Direct Install (USB Debugging)
1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Go to Settings → System → Developer Options
   - Enable "USB Debugging"
3. Connect phone via USB
4. In Android Studio, click the **Run** button (green play icon)
5. Select your device from the list

### Method 2: Install APK File
1. Transfer the APK to your phone (via USB, email, etc.)
2. Open the APK file on your phone
3. Allow installation from unknown sources if prompted
4. Install and open the app

---

## 🔔 Notification Permissions Explained

### The Problem with Applilix
- Applilix wraps your web app in a WebView
- It **cannot request native Android permissions**
- Notifications don't work properly

### How Capacitor Fixes This
- Creates a **real native Android app**
- Uses Capacitor's `PushNotifications` plugin
- Properly requests `POST_NOTIFICATIONS` permission
- Works on **Android 13+** (which requires explicit permission)

### How It Works in Your App
1. When app starts, `useCapacitorNotifications()` hook runs
2. It calls `PushNotifications.requestPermissions()`
3. **Android shows the native permission dialog**
4. User grants permission ✅
5. Your app can now send and receive notifications!

---

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Run web version
npm run build           # Build web assets
```

### Mobile
```bash
npm run mobile:sync     # Build + sync to Android
npm run mobile:android  # Open Android Studio
npm run mobile:run      # Build, sync, and run on device
```

---

## 🌐 Using Firebase Cloud Messaging (Optional)

To send push notifications from your server:

### 1. Set up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Add Android app with package name: `com.taskhive.app`
4. Download `google-services.json`
5. Place it in: `android/app/google-services.json`

### 2. Configure Android
Add to `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Add to `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. Send Push Notifications
When a user logs in, their FCM token is available in the hook:
```typescript
const { pushToken } = useCapacitorNotifications();
// Save this token to Supabase user profile
// Use it to send push notifications via Firebase Admin SDK
```

---

## 📦 Generating a Release APK

For production (smaller file size, better performance):

### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore taskhive-release-key.keystore -alias taskhive -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing
Create `android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=taskhive
storeFile=taskhive-release-key.keystore
```

### 3. Build Release APK
In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose APK
3. Select your keystore
4. Build release variant

---

## 🏪 Publishing to Google Play Store

1. **Create Developer Account** ($25 one-time fee)
2. **Prepare App Listing**:
   - App name: TaskHive
   - Screenshots (required)
   - Description
   - Privacy Policy
3. **Upload Release APK/AAB**
4. **Submit for Review**

---

## 🐛 Troubleshooting

### "Notification permission denied"
- User denied permission
- They can enable it in: **Android Settings → Apps → TaskHive → Permissions → Notifications**

### "Build failed in Android Studio"
- Make sure you have JDK 17 installed
- Run `npx cap sync` again
- Clean build: **Build → Clean Project**

### "App won't install on phone"
- Enable "Install from Unknown Sources"
- Or use USB debugging method

### Web version still uses old routing
- Clear browser cache
- Run `npm run build` again
- Check you're using HashRouter (should see `#` in URLs)

---

## 📝 Next Steps

1. ✅ Build and test on your phone
2. 🔔 Test notification permissions
3. 🎨 Customize app icon (in `android/app/src/main/res/mipmap-*`)
4. 📱 Set up Firebase for push notifications (optional)
5. 🚀 Publish to Play Store

---

## 💡 Key Files

- `capacitor.config.ts` - Capacitor configuration
- `src/services/capacitorNotificationService.ts` - Native notifications
- `src/hooks/useCapacitorNotifications.ts` - Notification initialization
- `android/app/src/main/AndroidManifest.xml` - Android permissions

---

## 🎉 Success!

Your app now has **real native Android notification permissions** that work properly, unlike web wrappers like Applilix!

For questions, check the [Capacitor Documentation](https://capacitorjs.com/docs).
