import { EventList } from '@/components/event-list';

export default function Home() {
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

      <EventList />
    </main>
  );
}
