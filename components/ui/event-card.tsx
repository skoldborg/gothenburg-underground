import { EventData } from '@/services/events';
import type { ReactNode } from 'react';

export interface EventCardProps extends Omit<EventData, 'id'> {
  cta?: ReactNode; // optional action, e.g. a link button
}

export const EventCard = ({
  title,
  date,
  location,
  description,
  start,
  end,
  cta,
}: EventCardProps) => {
  return (
    <article
      className="rounded-xl border p-4 shadow-sm ring-1 ring-black/5 bg-zinc-900/40 border-zinc-800/60  backdrop-blur-sm transition hover:shadow-md"
      aria-labelledby={`event-${encodeURIComponent(title)}-title`}
    >
      <div className="flex items-start justify-between gap-4">
        <header className="min-w-0">
          <h3
            id={`event-${encodeURIComponent(title)}-title`}
            className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            <time dateTime={date}>{date}</time>
            {start && end ? (
              <>
                {' '}
                {start} - {end}
              </>
            ) : start ? (
              <> {start}</>
            ) : null}
            <span className="mx-2">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="sr-only">Venue:</span>
              {location}
            </span>
          </p>
        </header>
        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>

      {description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {description}
        </p>
      ) : null}
    </article>
  );
};
