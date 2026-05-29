import { Skeleton } from "@/components/ui/skeleton";

export default function SignalDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-5 w-28 mb-6" />
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-6 space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
