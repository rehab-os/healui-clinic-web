import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-brand-teal mb-4">404</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 bg-brand-teal text-white text-sm font-medium rounded-lg hover:bg-brand-teal/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
