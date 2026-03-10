import { Skeleton } from '../skeleton'

interface ListSkeletonProps {
  count?: number
  showSearch?: boolean
}

export function ListSkeleton({ count = 5, showSearch = true }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  )
}
