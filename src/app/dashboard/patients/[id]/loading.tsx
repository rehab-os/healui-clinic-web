import { DetailSkeleton } from '@/components/ui/skeletons/DetailSkeleton'

export default function PatientDetailLoading() {
  return (
    <div className="py-4">
      <DetailSkeleton />
    </div>
  )
}
