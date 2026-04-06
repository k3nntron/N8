# N8 Backend (Render)

This service provides:
- LiveKit token generation
- Invite sending via Twilio (SMS/WhatsApp) and Resend (email)

## Run locally

1. Copy `.env.example` to `.env` and fill values.
2. Install deps:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   npm start
   ```

## Deploy on Render

1. Create a new **Web Service** on Render.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env.example`.

## Frontend config

Set this in the Vite app `.env`:

```
VITE_BACKEND_URL=https://your-render-service.onrender.com
VITE_PUBLIC_APP_URL=https://your-frontend-url
```
