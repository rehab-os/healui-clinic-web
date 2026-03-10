import { Skeleton } from '@/components/ui/skeleton'

export default function ClinicsLoading() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
