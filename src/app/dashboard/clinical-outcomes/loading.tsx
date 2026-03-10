import { Skeleton } from '@/components/ui/skeleton'

export default function ClinicalOutcomesLoading() {
  return (
    <div className="space-y-6 py-4">
      <Skeleton className="h-6 w-36" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
