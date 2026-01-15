# Backend Integration Guide

Your professional Node.js backend is ready in the `server/` directory. Follow these steps to connect your frontend.

## 1. Backend Setup (Done)
The backend is already set up with:
- **Express + Mongoose**: For API and Database.
- **JWT Auth**: Secure login/registration.
- **Gemini AI Proxy**: Hides your API Key from the browser.
- **Docker**: Ready for deployment.

To start the server:
```bash
cd server
npm run dev
```
Ensure you have MongoDB running locally or update `MONGO_URI` in `server/.env`.
Also, add your Google `API_KEY` to `server/.env`.

## 2. Frontend Integration

### Step A: Install Axios
In your project root (client):
```bash
npm install axios
```

### Step B: Update Imports
In `App.tsx`, change the import from `geminiService` to `api`.

**Before:**
```typescript
import { convertResumeFile, createResumeFromText, ... } from './services/geminiService';
```

**After:**
```typescript
import { convertResumeFile, createResumeFromText, ... } from './services/api';
```

### Step C: Add Authentication UI
You need to add a Login/Register form to your App.
1. Create a `LoginModal` component.
2. Use `api.login({ email, password })` to authenticate.
3. On success, store the token/user state.

**Example Logic:**
```typescript
import { login, register } from './services/api';

const handleLogin = async () => {
  try {
    await login({ email: 'user@example.com', password: 'password123' });
    alert('Logged in!');
  } catch (err) {
    alert('Login failed');
  }
};
```

### Step D: Protect Features
Make sure users are logged in before they can save resumes (once you implement the "Save" button).

## 3. Deployment
- **Backend**: Deploy `server/` to Render/Railway/Heroku. Set env vars there.
- **Frontend**: Deploy `client` (current root) to Vercel/Netlify. Update `API_URL` without `localhost` in `services/api.ts` (or use env var `VITE_API_URL`).

## 4. API Endpoints Reference
See `server/README.md` for a full list of endpoints.
