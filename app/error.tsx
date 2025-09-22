'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          Gothenburg Underground
        </h1>
        <p className="max-w-prose text-sm text-zinc-400">
          Independent electronic music, DIY venues, late nights. Curated weekly.
        </p>
      </div>

      <section className="mx-auto">
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-red-400">
              Failed to load events
            </h2>
            <p className="text-sm text-red-300">
              We are having trouble loading the latest events. This might be a
              temporary issue with our data source.
            </p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Try again
              </button>
              <a
                href="https://www.monument031.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-red-600 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Visit source
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
