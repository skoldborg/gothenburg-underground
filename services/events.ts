export type Event = {
  uid: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  start?: string;
  end?: string;
};

export async function getEvents(): Promise<Event[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`,
    {
      next: { revalidate: 3600 }, // Revalidate every hour
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.events;
}
