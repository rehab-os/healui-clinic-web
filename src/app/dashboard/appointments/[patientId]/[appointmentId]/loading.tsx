import { Skeleton } from '@/components/ui/skeleton'

export default function AppointmentDetailLoading() {
  return (
    <div className="space-y-4 py-4">
      {/* Patient Header */}
      <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column - Conditions */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-7 w-20 rounded-md" />
                    <Skeleton className="h-7 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Section */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Insights */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <Skeleton className="h-6 w-6 rounded-full mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
