import axios from 'axios';

// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// Replace with your computer's actual IP address on your local network.
// Do NOT use localhost or 127.0.0.1 — it won't work on a physical device.
// To find your IP:
//   • Windows: run `ipconfig` → look for IPv4 Address
//   • Mac/Linux: run `ifconfig` → look for inet address
// Example: const BASE_URL = 'http://192.168.1.105:8000';
// ──────────────────────────────────────────────────────────────────────────────
export const BASE_URL = 'http://10.51.158.109:8000';
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min timeout for large videos
  headers: {
    Accept: 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use(
  async (config) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auth API ──────────────────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// ── Analysis API ──────────────────────────────────────────────────────────────

/**
 * Send a video file to the backend for AI analysis.
 * @param {string} videoUri - Local URI of the video file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<AnalysisResult>}
 */
export const analyzeVideo = async (videoUri, onProgress) => {
  const formData = new FormData();

  // Determine file name and type from URI
  const uriParts = videoUri.split('.');
  const fileExtension = uriParts[uriParts.length - 1];
  const mimeType = fileExtension === 'mov' ? 'video/quicktime' : 'video/mp4';

  formData.append('file', {
    uri: videoUri,
    name: `delivery_${Date.now()}.${fileExtension}`,
    type: mimeType,
  });

  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Expected response shape from /analyze:
 * {
 *   speed: "135 km/h",
 *   trajectory: [[100,200],[120,220],[140,250], ...],
 *   detections: [
 *     { frame: 1, x: 120, y: 200, confidence: 0.95 },
 *     { frame: 2, x: 140, y: 220, confidence: 0.92 },
 *     ...
 *   ]
 * }
 */

export default api;
