# Cricket Vision – AI Umpire Assistant
### Final Year Project | React Native (Expo) + FastAPI

---

## Project Structure

```
CricketVision/
├── App.js                          ← Entry point
├── app.json                        ← Expo config (permissions etc.)
├── package.json
├── babel.config.js
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.js        ← Auth gate (logged in → main, else → auth)
│   │   ├── AuthNavigator.js        ← Login / Register stack
│   │   └── MainNavigator.js        ← Tab + stack for main app
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CameraScreen.js         ← Expo Camera, records video
│   │   ├── UploadScreen.js         ← Expo Image Picker
│   │   └── ResultScreen.js         ← Video player + SVG trajectory
│   ├── services/
│   │   └── api.js                  ← All Axios API calls (SET YOUR IP HERE)
│   └── utils/
│       ├── theme.js                ← Colors, fonts, spacing
│       └── AuthContext.js          ← Auth state + AsyncStorage persistence
└── backend/
    ├── main.py                     ← FastAPI server
    └── requirements.txt
```

---

## Quick Start

### 1. Install Node dependencies

```bash
npm install
```

### 2. Set your PC's IP address in the app

Open `src/services/api.js` and change:
```js
export const BASE_URL = 'http://192.168.1.100:8000';
//                             ↑ Replace with your actual PC IP
```

**How to find your IP:**
- Windows: Open CMD → run `ipconfig` → find **IPv4 Address**
- Mac/Linux: Open Terminal → run `ifconfig` → find **inet** address

> ⚠️ Your phone and PC must be on the **same Wi-Fi network**.

### 3. Start the Expo app

```bash
npx expo start
```

Scan the QR code with:
- iOS: Camera app
- Android: Expo Go app (install from Play Store)

---

## Backend Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Integrate your trained model

Open `backend/main.py` and find the `run_cricket_model()` function.

Replace the `raise NotImplementedError(...)` block with your model inference:

#### Option A — YOLOv8 (recommended)
```python
from ultralytics import YOLO

# Load once at startup (outside the function, at module level)
model = YOLO("path/to/your/best.pt")

# Inside run_cricket_model(), replace the raise with:
results = model(frame, verbose=False)
for box in results[0].boxes:
    cls = int(box.cls[0])
    if cls == 0:  # cricket ball class index
        x_center, y_center, w, h = box.xywh[0].tolist()
        conf = float(box.conf[0])
        # use x_center, y_center as detection coordinates
```

#### Option B — Custom PyTorch model
```python
import torch

# Load once at startup
model = torch.load("your_model.pth", map_location="cpu")
model.eval()

# Inside run_cricket_model():
tensor = preprocess_frame(frame)  # your preprocessing
with torch.no_grad():
    output = model(tensor)
# parse output for x, y coordinates
```

### 4. Run the backend server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test it: Open a browser on your PC → `http://localhost:8000/health`
Expected: `{"status":"ok","service":"Cricket Vision API"}`

---

## API Reference

### POST /auth/register
```json
Request:  { "name": "Ahmed", "email": "a@b.com", "password": "secret" }
Response: { "message": "Account created successfully" }
```

### POST /auth/login
```
Content-Type: multipart/form-data
Fields: username, password
```
```json
Response: {
  "access_token": "eyJ...",
  "name": "Ahmed",
  "email": "a@b.com",
  "user_id": "uuid"
}
```

### POST /analyze
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
Field: file (video)
```
```json
Response: {
  "speed": "135.4 km/h",
  "trajectory": [[100,200],[120,220],[140,250]],
  "detections": [
    {"frame": 1, "x": 100, "y": 200, "confidence": 0.95},
    {"frame": 2, "x": 120, "y": 220, "confidence": 0.92}
  ],
  "processing_time": 3.21
}
```

---

## Common Issues & Fixes

| Problem | Fix |
|--------|-----|
| App can't reach backend | Check IP in `api.js`, ensure same Wi-Fi |
| Camera permission denied | Go to Phone Settings → Apps → Cricket Vision → Permissions |
| `ECONNREFUSED` error | Backend server not running, start it with `uvicorn` |
| Video upload hangs | Check `timeout` in `api.js` (default 120s), reduce video length |
| `NotImplementedError` from backend | You must integrate your AI model in `run_cricket_model()` |
| Token expired / 401 error | Log out and log back in |

---

## Production Checklist

- [ ] Replace in-memory `fake_users_db` with PostgreSQL or SQLite
- [ ] Change `SECRET_KEY` in `main.py` to a strong random value
- [ ] Tighten `allow_origins` in CORS middleware
- [ ] Add HTTPS (use nginx reverse proxy or deploy to Railway/Render)
- [ ] Load AI model once at startup (not per request)
- [ ] Add rate limiting to `/analyze` endpoint
- [ ] Store analysis results in database for history feature

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 51) |
| Navigation | React Navigation v6 |
| Camera | expo-camera |
| Gallery | expo-image-picker |
| Video playback | expo-av |
| Trajectory drawing | react-native-svg |
| Auth persistence | @react-native-async-storage |
| HTTP client | axios |
| Backend | Python FastAPI |
| Auth | JWT (python-jose) + bcrypt |
| Video processing | OpenCV (cv2) |
| AI model | Your trained model (YOLO/PyTorch/TF) |
