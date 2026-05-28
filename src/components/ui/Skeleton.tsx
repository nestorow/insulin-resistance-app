// Generic shimmer placeholder. Used while the journal / markers modules
// are hydrating from localStorage (and SyncOnLogin is pulling history
// from Turso for signed-in users) — avoids the "blank → suddenly full"
// flash that hurts perceived performance on slow networks.

interface SkeletonProps {
  className?: string;
  rows?: number;
}

/** A single shimmering pill — width set by tailwind class. */
export function SkeletonBar({ className = "h-4 w-24" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-md shimmer ${className}`}
    />
  );
}

/** A stack of full-width entry-row placeholders. */
export function SkeletonRows({ rows = 3 }: SkeletonProps) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-teal-100 bg-white p-3"
        >
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-14" />
          <SkeletonBar className="h-3 w-14" />
          <SkeletonBar className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
