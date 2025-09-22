import { Transition } from '@headlessui/react';
import { EventCard } from '../ui/event-card';
import { getEvents } from '@/services/events';

export const EventList = async () => {
  const events = await getEvents();

  return (
    <section aria-labelledby="events-heading" className="mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="events-heading"
          className="text-base font-semibold text-zinc-400"
        >
          Upcoming events
        </h2>
        <p className="text-sm text-zinc-400" aria-live="polite">
          {events.length} events
        </p>
      </div>

      <ul role="list" className="grid gap-4">
        <Transition show appear>
          {events.map((ev) => (
            <li key={ev.uid} className="list-none">
              <EventCard
                uid={ev.uid}
                title={ev.title}
                date={ev.date}
                location={ev.location}
                description={ev.description}
                start={ev.start}
                end={ev.end}
              />
            </li>
          ))}
        </Transition>
      </ul>
    </section>
  );
};
