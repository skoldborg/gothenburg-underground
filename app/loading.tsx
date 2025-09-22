export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Gothenburg Underground
        </h1>
        <p className="max-w-prose text-sm text-zinc-400">
          Underground music, DIY venues, late nights. Curated weekly.
        </p>
      </div>

      <section className="mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-400">
            Upcoming events
          </h2>
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-700" />
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <div className="space-y-3">
                <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-700" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-700" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-700" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
