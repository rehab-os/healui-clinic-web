# HealUI Deployment Guide

## Current Configuration

- **Backend**: https://healui-backend-core.onrender.com
- **Frontend**: Deploy to Vercel/Netlify
- **API Base URL**: `https://healui-backend-core.onrender.com/api/v1/`

## Environment Variables Required

### For Development (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://healui-backend-core.onrender.com/api/v1/

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

### For Production Deployment

#### Vercel Deployment:
1. Connect your GitHub repository to Vercel
2. Go to Project Settings → Environment Variables
3. Add all the above variables
4. Deploy

#### Netlify Deployment:
1. Connect your GitHub repository to Netlify
2. Go to Site Settings → Environment Variables
3. Add all the above variables
4. Deploy

## Testing

### Development Testing:
```bash
npm run dev
# Access at http://localhost:3000
# Will connect to https://healui-backend-core.onrender.com
```

### Production Testing:
- Both mobile and desktop will work with the deployed backend
- No localhost issues since using public HTTPS URL
- Cross-platform compatibility ensured

## Backend Health Check

Test if backend is accessible:
```bash
curl https://healui-backend-core.onrender.com/api/v1/health
```

Or visit in browser:
https://healui-backend-core.onrender.com/api/v1/health

## Common Issues

1. **CORS Errors**: Ensure backend allows your frontend domain
2. **Environment Variables Not Loading**: Restart dev server after changing .env files
3. **Firebase Auth Domain**: Add your deployment domain to Firebase authorized domains
4. **SSL Certificate**: Render provides HTTPS automatically

## Firebase Configuration

Make sure to add these domains to Firebase Auth:
- `localhost:3000` (development)
- Your Vercel/Netlify domain (production)
- `healui-backend-core.onrender.com` (if backend needs Firebase)

## Deployment Checklist

- [ ] Backend deployed and accessible at https://healui-backend-core.onrender.com
- [ ] Environment variables configured in deployment platform
- [ ] Firebase domains added
- [ ] CORS configured in backend
- [ ] SSL/HTTPS working
- [ ] Mobile testing completed
- [ ] Desktop testing completed