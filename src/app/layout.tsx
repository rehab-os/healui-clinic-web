import './global.css';
import { ReduxProvider } from '../components/providers/ReduxProvider';
import { AppMantineProvider } from '../components/providers/MantineProvider';
import { AuthProvider } from '../components/providers/AuthProvider';

export const metadata = {
  title: 'Healui.ai - World\'s First AI-Powered Physiotherapy EMR Software | Smart Clinical Management',
  description: 'Revolutionary AI-based EMR software for physiotherapy clinics. World\'s first AI-powered physiotherapy electronic medical records system with automated documentation, intelligent patient management, and advanced clinical analytics for modern physio practices.',
  keywords: 'AI physiotherapy EMR, AI physio EMR software, physiotherapy AI EMR, electronic medical records physiotherapy, AI-powered physiotherapy software, smart physio clinic management, automated physiotherapy documentation, AI clinical intelligence physiotherapy, machine learning physiotherapy EMR, artificial intelligence rehabilitation software',
  author: 'Healui.ai',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Healui.ai - World\'s First AI-Powered Physiotherapy EMR Software',
    description: 'Revolutionary AI-based EMR software for physiotherapy clinics. Automated documentation, intelligent patient management, and advanced clinical analytics.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Healui.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healui.ai - World\'s First AI-Powered Physiotherapy EMR Software',
    description: 'Revolutionary AI-based EMR software for physiotherapy clinics. Automated documentation, intelligent patient management, and advanced clinical analytics.',
  },
  alternates: {
    canonical: 'https://healui.ai',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'Healthcare Technology',
  icons: {
    icon: [
      {
        url: '/favicon.ico?v=2',
        sizes: '16x16 32x32',
        type: 'image/x-icon',
      },
      {
        url: '/favicon.png?v=2',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: [
      {
        url: '/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest?v=2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Healui.ai - AI-Powered Physiotherapy EMR",
              "description": "World's first AI-powered physiotherapy electronic medical records software with automated documentation, intelligent patient management, and advanced clinical analytics.",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "category": "Healthcare Software",
                "businessFunction": "Practice Management"
              },
              "featureList": [
                "AI-powered physiotherapy documentation",
                "Automated patient records management",
                "Smart clinical analytics",
                "Intelligent appointment scheduling",
                "Advanced reporting and insights",
                "Multi-clinic management",
                "Secure patient data storage"
              ],
              "targetAudience": {
                "@type": "Audience",
                "audienceType": "Physiotherapists, Physical Therapy Clinics, Healthcare Professionals"
              },
              "provider": {
                "@type": "Organization",
                "name": "Healui.ai",
                "url": "https://healui.ai"
              }
            })
          }}
        />
      </head>
      <body>
        <ReduxProvider>
          <AuthProvider>
            <AppMantineProvider>
              {children}
            </AppMantineProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
