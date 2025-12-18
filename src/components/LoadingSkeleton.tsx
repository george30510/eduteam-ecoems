import { Skeleton } from '@/components/ui/skeleton';

export const ExamSkeleton = () => (
  <div className="min-h-screen bg-background flex flex-col animate-fade-in">
    {/* Header skeleton */}
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24 hidden sm:block" />
        </div>
      </div>
    </header>

    {/* Content skeleton */}
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background animate-fade-in">
    {/* Header */}
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </header>

    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        
        {/* CTA */}
        <Skeleton className="h-16 w-full rounded-xl" />
        
        {/* Chart */}
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </main>
  </div>
);

export const ResultsSkeleton = () => (
  <div className="min-h-screen bg-background animate-fade-in">
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    </header>

    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </main>
  </div>
);