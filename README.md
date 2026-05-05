# Cricket Vision – AI Umpire Assistant (Frontend)

A React Native mobile application built with Expo for real-time cricket ball detection and speed analysis using AI.

---

## Overview

Cricket Vision Frontend is a mobile app that allows users to:
- **Record or upload cricket videos**
- **Send videos to backend for AI analysis**
- **View detected ball trajectory with speed calculations**
- **Authenticate and manage user accounts**

---

## Project Structure

```
CricketVision Frontend/
├── App.js                          ← Entry point
├── app.json                        ← Expo config (permissions, etc.)
├── package.json                    ← Dependencies
├── babel.config.js                 ← Babel configuration
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.js        ← Auth gate (logged in → main, else → auth)
│   │   ├── AuthNavigator.js        ← Login / Register stack
│   │   └── MainNavigator.js        ← Tab-based + stack navigation for main app
│   ├── screens/
│   │   ├── LoginScreen.js          ← User login with email/password
│   │   ├── RegisterScreen.js       ← User registration
│   │   ├── HomeScreen.js           ← Dashboard/main screen
│   │   ├── CameraScreen.js         ← Expo Camera, records video
│   │   ├── UploadScreen.js         ← Expo Image Picker for gallery uploads
│   │   └── ResultScreen.js         ← Video player + SVG trajectory overlay
│   ├── services/
│   │   └── api.js                  ← Axios API client (configure backend IP here)
│   └── utils/
│       ├── theme.js                ← Colors, fonts, spacing constants
│       └── AuthContext.js          ← Auth state management + AsyncStorage persistence
├── assets/                         ← Images, icons, fonts
└── README.md                       ← This file
```

---

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher) and npm
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go** app installed on your phone (iOS App Store / Android Play Store)
- **Backend server** running on your PC (see Backend Setup docs)
- **Phone and PC on the same Wi-Fi network**

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend IP Address

Open [src/services/api.js](src/services/api.js) and update the `BASE_URL`:

```javascript
export const BASE_URL = 'http://192.168.1.100:8000';
//                             ↑ Replace with your actual PC IP
```

**How to find your PC's IP:**

| OS | Command |
|----|---------|
| **Windows** | Open CMD → `ipconfig` → find **IPv4 Address** |
| **Mac** | Open Terminal → `ifconfig` → find **inet** |
| **Linux** | Open Terminal → `hostname -I` |

> ⚠️ **Important**: Your phone and PC must be connected to the **same Wi-Fi network**.

### 3. Start the Expo Development Server

```bash
npx expo start
```

You'll see a terminal output with a QR code.

### 4. Open on Your Phone

- **iOS**: Use the built-in Camera app to scan the QR code
- **Android**: Use the Expo Go app to scan the QR code

The app will build and open on your phone automatically.

---

## Features & Screens

| Screen | Purpose |
|--------|---------|
| **LoginScreen** | Authenticate with email/password |
| **RegisterScreen** | Create new user account |
| **HomeScreen** | View previous analyses, navigate to camera/upload |
| **CameraScreen** | Record cricket video in real-time |
| **UploadScreen** | Select video from phone gallery |
| **ResultScreen** | Display analysis results with trajectory overlay |

---

## Folder Guide

### `/src/navigation`
Handles all navigation flows using React Navigation v6:
- **RootNavigator**: Conditionally renders auth or main stack based on login state
- **AuthNavigator**: Login → Register flow
- **MainNavigator**: Bottom tabs for Home, Camera, Upload screens

### `/src/screens`
Individual screen components:
- Handles user interactions (camera capture, video selection)
- Calls API endpoints via `services/api.js`
- Displays results using video player + SVG trajectory

### `/src/services`
**api.js** exports all API functions:
```javascript
export const registerUser(data) // POST /auth/register
export const loginUser(credentials) // POST /auth/login
export const analyzeVideo(token, videoFile) // POST /analyze
```

### `/src/utils`
**AuthContext.js**: Global auth state using React Context + AsyncStorage
- Persists login token locally
- Provides `useAuth()` hook for screens

**theme.js**: Centralized styling
- Colors, fonts, spacing constants
- Ensures consistent UI across screens

## API Integration (Frontend Client)

The frontend communicates with the backend API. Here's how the main endpoints are used:

### Registration Endpoint
**Screen**: RegisterScreen.js

```javascript
POST /auth/register

// Frontend call:
const response = await registerUser({
  name: "Ahmed",
  email: "a@b.com",
  password: "secret"
});

// Response:
{
  "message": "Account created successfully"
}
```

### Login Endpoint
**Screen**: LoginScreen.js

```javascript
POST /auth/login
Content-Type: multipart/form-data

// Frontend call:
const response = await loginUser({
  username: "a@b.com",
  password: "secret"
});

// Response:
{
  "access_token": "eyJ...",
  "name": "Ahmed",
  "email": "a@b.com",
  "user_id": "uuid"
}
```

### Analysis Endpoint
**Screen**: ResultScreen.js (after upload)

```javascript
POST /analyze
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Frontend call:
const response = await analyzeVideo(token, videoFile);

// Response:
{
  "speed": "135.4 km/h",
  "trajectory": [[100,200],[120,220],[140,250]],
  "detections": [
    {"frame": 1, "x": 100, "y": 200, "confidence": 0.95},
    {"frame": 2, "x": 120, "y": 220, "confidence": 0.92}
  ],
  "processing_time": 3.21
}
```

See [API_ENDPOINTS.md](../CrickVision%20backend/API_ENDPOINTS.md) for complete backend documentation.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **App can't connect to backend** | 1. Check backend server is running<br>2. Verify PC IP in [src/services/api.js](src/services/api.js)<br>3. Ensure phone and PC are on same Wi-Fi |
| **Camera permission denied** | Go to Phone Settings → Apps → Cricket Vision → Permissions → Allow Camera |
| **Microphone permission denied** | Go to Phone Settings → Apps → Cricket Vision → Permissions → Allow Microphone |
| **Video upload hangs** | 1. Check network connection<br>2. Reduce video length (try under 30 seconds)<br>3. Check `timeout` in [src/services/api.js](src/services/api.js) |
| **`ECONNREFUSED` error** | Backend server not running. Start it on your PC using `uvicorn` |
| **Login fails with 401** | Verify email/password are correct |
| **Token expired / Unauthorized** | Log out and log back in to refresh token |
| **App crashes on camera screen** | Check iOS camera permissions in app.json / phone settings |
| **QR code won't scan** | Try manual URL entry: `exp://YOUR_PC_IP:19000` |
| **Video player doesn't show** | Ensure backend returned valid response with trajectory data |

---

## Development Tips

### Running with Expo Go
```bash
npx expo start
# In terminal: press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

### Building for Production
```bash
# Generate native build
eas build --platform ios  # for iOS
eas build --platform android  # for Android
```

### Debugging
- **Console Logs**: Use `console.log()` — logs appear in Expo terminal
- **React DevTools**: Install from React Native debugger
- **Breakpoints**: Use Chrome DevTools at `http://localhost:19001/debugger-ui/`

### Hot Reload vs Full Reload
- **Hot reload** (Cmd+R / Ctrl+R): Reload JS code, keeps app state
- **Full reload** (Cmd+D+R / Ctrl+D+R): Full restart, clears state

---

## Production Checklist

- [ ] Remove debug console.logs before release
- [ ] Update `BASE_URL` to production backend domain
- [ ] Enable HTTPS for backend API (use https:// not http://)
- [ ] Test on physical devices before release
- [ ] Update app.json with correct app name, version, and icon
- [ ] Generate app signing certificates (iOS: Apple Developer, Android: keystore)
- [ ] Test all camera and gallery permissions on target devices
- [ ] Add privacy policy and terms of service
- [ ] Submit to Apple App Store and/or Google Play Store
- [ ] Set up analytics/crash reporting (Sentry, Bugsnag, etc.)

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React Native (Expo SDK 51) | Cross-platform mobile development |
| **Navigation** | React Navigation v6 | Screen and stack navigation |
| **State Management** | React Context + AsyncStorage | Auth state & persistence |
| **Camera** | expo-camera | Video recording |
| **Gallery** | expo-image-picker | Video/image selection |
| **Video Playback** | expo-av | Video player component |
| **Graphics** | react-native-svg | Trajectory overlay drawing |
| **HTTP Client** | axios | API requests |
| **Styling** | react-native StyleSheet | Component styling |
| **Development** | Expo CLI | Local development & testing |
| **Build** | EAS Build | Production app building |

---

## File Descriptions

### Core Files

| File | Purpose |
|------|---------|
| [App.js](App.js) | App entry point, renders RootNavigator |
| [app.json](app.json) | Expo config (permissions, splash screen, etc.) |
| [package.json](package.json) | Dependencies and scripts |
| [babel.config.js](babel.config.js) | Babel preset configuration |

### Navigation

| File | Purpose |
|------|---------|
| [RootNavigator.js](src/navigation/RootNavigator.js) | Auth gate: shows auth stack or main stack |
| [AuthNavigator.js](src/navigation/AuthNavigator.js) | Login/Register stack |
| [MainNavigator.js](src/navigation/MainNavigator.js) | Bottom tab navigation + screens |

### Screens

| File | Purpose |
|------|---------|
| [LoginScreen.js](src/screens/LoginScreen.js) | Email/password login |
| [RegisterScreen.js](src/screens/RegisterScreen.js) | New account creation |
| [HomeScreen.js](src/screens/HomeScreen.js) | Dashboard with history |
| [CameraScreen.js](src/screens/CameraScreen.js) | Record video from camera |
| [UploadScreen.js](src/screens/UploadScreen.js) | Pick video from gallery |
| [ResultScreen.js](src/screens/ResultScreen.js) | Display analysis results |

---

## Scripts

```bash
# Development
npm start          # Start Expo dev server
npm run web        # Open in web browser

# Linting
npm run lint       # Check code style (if configured)

# Build
eas build          # Build for iOS/Android (requires EAS account)
```

---

## Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **React Navigation**: https://reactnavigation.org
- **Backend Setup**: See [../CrickVision%20backend/README.md](../CrickVision%20backend/README.md)

---

## Contributing

1. Create a feature branch: `git checkout -b feature/YourFeature`
2. Make your changes
3. Test on device: `npx expo start` → scan QR code
4. Commit: `git commit -m "Add YourFeature"`
5. Push: `git push origin feature/YourFeature`
6. Open a Pull Request

---

## License

This project is part of the Cricket Vision AI system. All rights reserved.
