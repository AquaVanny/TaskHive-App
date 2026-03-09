# 🐝 TaskHive

> Your All-in-One Productivity Hub for Tasks, Habits, and Collaborative Workspaces.

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E.svg)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Push_Notifications-FFCA28.svg)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Mobile_Support-119EFF.svg)](https://capacitorjs.com/)

## 🌟 Overview
TaskHive is a comprehensive application built to seamlessly manage personal productivity and team collaboration. Whether you are tracking daily tasks, building sustainable habits, or coordinating tasks within an organization, TaskHive has everything you need. 

Built with **React**, **TypeScript**, and styled with **Tailwind CSS** and **shadcn/ui**, it delivers a sleek, responsive, and robust user experience on the web. Via **Capacitor**, it supports fully native Android applications, while maintaining **Supabase** for secure backend ops and **Firebase** for reliable push notifications.

---

## ✨ Features
- **📊 Comprehensive Dashboard**: Get an at-a-glance overview of your day, upcoming tasks, and habit streaks.
- **✅ Task Management**: Create, assign, track, and complete tasks intuitively.
- **♻️ Habit Tracking**: Build positive routines with dedicated habit tracking mechanisms.
- **🏢 Organizations & Workspaces**: Collaborate seamlessly. Form organizations, invite teammates, and manage collective tasks securely.
- **📈 Advanced Analytics**: Keep track of your productivity metrics over time.
- **📱 Native Mobile Ready**: First-class support for Android deployments via Capacitor featuring local & push notifications.
- **🔒 Secure Authentication & Data**: Powered by Supabase Auth with robust Row Level Security (RLS) policies.

---

## 🛠 Tech Stack

- **Frontend Framework**: React 18 & Vite
- **Language**: TypeScript throughout the entire stack
- **Styling**: Tailwind CSS & shadcn/ui components
- **State Management**: Zustand
- **Data Fetching/Caching**: TanStack React Query
- **Routing**: React Router DOM (HashRouter)
- **Forms & Validation**: React Hook Form & Zod
- **Backend as a Service**: Supabase (PostgreSQL, Auth, Storage)
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Mobile Bridging**: Capacitor (iOS & Android compatible)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm, yarn, or bun
- A [Supabase](https://supabase.com) Project
- A [Firebase](https://firebase.google.com/) Project (for Push Notifications)
- *(Optional)* [Android Studio](https://developer.android.com/studio) (for Mobile builds)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AquaVanny/TaskHive-App.git
   cd TaskHive-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and populate it with your Supabase and Firebase credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL="your-supabase-url"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
   VITE_SUPABASE_PROJECT_ID="your-project-id"

   # Firebase Configuration (For Notifications)
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_VAPID_KEY="your-vapid-key"
   ```

4. **Database Setup:**
   Run the included `.sql` scripts located in the root directory (e.g., `check-all-recent-tasks.sql`, `test-email-system.sql`) in your Supabase SQL Editor to set up required tables and diagnose issues if necessary.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Your app will be available at `http://localhost:8080` (or another port based on Vite's configuration).*

---

## 📱 Mobile Build (Android)
TaskHive supports being built as a native Android app with full push notification capabilities via Capacitor.

### Quick Start
To build and sync changes to Android, simply run:
```bash
npm run mobile:android
```
*This command will build the web app, sync native capacitor files, and automatically launch Android Studio for you.*

For detailed setup, troubleshooting, and testing instructions, please refer to:
- [QUICK_START_MOBILE.md](./QUICK_START_MOBILE.md)
- [MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)

---

## 🗂️ Project Structure
```text
📦 src
 ┣ 📂 components   # Reusable UI components (buttons, dialogs, layouts)
 ┣ 📂 hooks        # Custom React hooks (e.g., useCapacitorNotifications)
 ┣ 📂 integrations # Setup for external services (Supabase, Firebase plugins)
 ┣ 📂 lib          # Library configurations and helpers (shadcn utils)
 ┣ 📂 pages        # React application routes (Dashboard, Tasks, Habits, etc.)
 ┣ 📂 services     # API and service layers handling application logic
 ┣ 📂 store        # Zustand global state (authStore, etc.)
 ┣ 📂 utils        # Standalone utility functions
 ┣ 📜 App.tsx      # Main application routing and providers
 ┗ 📜 main.tsx     # React application entry point
```

---

## 🤝 Contributing
Contributions are always welcome! Feel free to open issues or submit pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
*Built with ❤️ utilizing the latest modern web tech standards.*
