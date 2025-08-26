# Build Guide for HealUI Clinic Web

## Static Build Limitations

This application is a dynamic dashboard with authentication, real-time video calling, and dynamic routes. Due to these features, a full static export has limitations:

1. **Dynamic Routes**: Pages like `/dashboard/video-call/[visitId]` and `/patient-call/[visitId]` require `generateStaticParams()` for static export
2. **Authentication**: The app uses authentication which requires server-side functionality
3. **API Calls**: The app makes external API calls to your backend
4. **Real-time Features**: Video calling with Agora requires dynamic functionality

## Build Options

### Option 1: Server-Side Build (Recommended)
Remove the static export configuration and use standard Next.js build:

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}
```

Build command: `npm run build`

### Option 2: Partial Static Export
If you need static pages for marketing/landing pages only, create a separate build configuration or split the app.

### Option 3: Static Site Generation (SSG) with Dynamic Data
Use Next.js ISR (Incremental Static Regeneration) for semi-static pages with `revalidate`.

## Current Configuration

The current configuration is set up for static export but encounters issues with dynamic routes. To fix:

1. Either implement `generateStaticParams()` for all dynamic routes
2. Or switch to server-side rendering

## Deployment Recommendations

1. **Vercel** (Recommended): Automatic deployment with full Next.js feature support
2. **Self-hosted**: Use Node.js server with PM2
3. **Docker**: Containerize the application for consistent deployments
4. **AWS/GCP**: Deploy to cloud services with Node.js runtime

## Fix ESLint/TypeScript Issues

Before production deployment, it's recommended to fix the ESLint and TypeScript errors by running:
```bash
npm run lint
```

And addressing the reported issues rather than ignoring them in the build.