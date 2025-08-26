# Mobile Access Setup Guide

## The Issue
When testing on mobile devices, you're getting "failed to fetch" error after OTP verification because mobile devices cannot access `localhost:3002` (your backend API).

## Solutions

### Option 1: Use Your Computer's Local IP (Recommended for Development)

1. **Find your computer's local IP address:**
   - On Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - On Windows: `ipconfig` and look for IPv4 Address
   - Example: `192.168.1.100`

2. **Update your `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3002/api/v1/
   ```

3. **Ensure your backend is accessible:**
   - Make sure your backend server is running on `0.0.0.0:3002` not just `localhost:3002`
   - Check your backend's server configuration

4. **Access from mobile:**
   - Use `http://192.168.1.100:3000` (your Next.js app)
   - Both devices must be on the same WiFi network

### Option 2: Use ngrok (For Testing with External Devices)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your backend and frontend:**
   ```bash
   # Terminal 1 - Backend
   npm run dev  # or your backend start command

   # Terminal 2 - Frontend
   npm run dev
   ```

3. **Create ngrok tunnels:**
   ```bash
   # Terminal 3 - Backend tunnel
   ngrok http 3002

   # Terminal 4 - Frontend tunnel  
   ngrok http 3000
   ```

4. **Update `.env.local` with ngrok URL:**
   ```env
   NEXT_PUBLIC_API_URL=https://abc123.ngrok.io/api/v1/
   ```

5. **Access from mobile:**
   - Use the ngrok URL for frontend: `https://xyz456.ngrok.io`

### Option 3: Deploy to Staging (Production-like Testing)

1. Deploy your backend to a cloud service (Heroku, Railway, etc.)
2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com/api/v1/
   ```
3. Deploy frontend to Vercel/Netlify
4. Access from anywhere

## CORS Configuration

Make sure your backend allows requests from mobile browsers:

```javascript
// Backend CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://192.168.1.100:3000', // Your local IP
    'https://*.ngrok.io', // ngrok URLs
    // Add your production domains
  ],
  credentials: true
};
```

## Troubleshooting

1. **Still getting "failed to fetch"?**
   - Check if backend is running
   - Verify the API URL in browser console
   - Check browser's network tab for actual error

2. **SSL Certificate Issues?**
   - Mobile browsers may block mixed content (HTTP API from HTTPS site)
   - Use ngrok for HTTPS tunnels in development

3. **Firebase Auth Issues?**
   - Ensure Firebase Auth domain is properly configured
   - Add your testing domains to Firebase authorized domains

## Security Notes

- Never expose your local development server to the internet without proper security
- Use environment variables for all sensitive configuration
- In production, always use HTTPS for API endpoints