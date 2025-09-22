import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventList } from '@/components/event-list/event-list';
import type { Event } from '@/services/events';

// Mock the events service
vi.mock('@/services/events', () => ({
  getEvents: vi.fn(),
}));

// Mock HeadlessUI Transition
vi.mock('@headlessui/react', () => ({
  Transition: ({
    children,
    show,
  }: {
    children: React.ReactNode;
    show: boolean;
  }) => (show ? <div data-testid="transition">{children}</div> : null),
}));

describe('EventList', () => {
  it('should render events list with correct data', async () => {
    const mockEvents: Event[] = [
      {
        uid: 'test-event-1@example.com',
        title: 'Test Event 1',
        date: '2024-01-01',
        location: 'Test Location 1',
        description: 'Test Description 1',
        start: '12:00',
        end: '14:00',
      },
      {
        uid: 'test-event-2@example.com',
        title: 'Test Event 2',
        date: '2024-01-02',
        location: 'Test Location 2',
        description: 'Test Description 2',
        start: '15:00',
      },
    ];

    const { getEvents } = await import('@/services/events');
    vi.mocked(getEvents).mockResolvedValue(mockEvents);

    const EventListComponent = await EventList();
    render(EventListComponent);

    expect(screen.getByText('Upcoming events')).toBeInTheDocument();
    expect(screen.getByText('2 events')).toBeInTheDocument();
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    expect(screen.getByText('Test Location 1')).toBeInTheDocument();
    expect(screen.getByText('Test Location 2')).toBeInTheDocument();
  });

  it('should render empty state when no events', async () => {
    const { getEvents } = await import('@/services/events');
    vi.mocked(getEvents).mockResolvedValue([]);

    const EventListComponent = await EventList();
    render(EventListComponent);

    expect(screen.getByText('Upcoming events')).toBeInTheDocument();
    expect(screen.getByText('0 events')).toBeInTheDocument();
  });

  it('should handle events without optional fields', async () => {
    const mockEvents: Event[] = [
      {
        uid: 'test-event-1@example.com',
        title: 'Test Event',
        date: '2024-01-01',
        location: 'Test Location',
        // No description, start, or end
      },
    ];

    const { getEvents } = await import('@/services/events');
    vi.mocked(getEvents).mockResolvedValue(mockEvents);

    const EventListComponent = await EventList();
    render(EventListComponent);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});
