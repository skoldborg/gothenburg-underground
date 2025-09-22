import { getEvents } from '@/services/events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('getEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return events successfully', async () => {
    const mockEvents = [
      {
        uid: 'test-event-1@example.com',
        title: 'Test Event',
        date: '2024-01-01',
        location: 'Test Location',
        description: 'Test Description',
        start: '12:00',
        end: '14:00',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: mockEvents }),
    } as Response);

    const result = await getEvents();

    expect(result).toEqual(mockEvents);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/events',
      {
        next: { revalidate: 3600 },
      },
    );
  });

  it('should use custom base URL when NEXT_PUBLIC_BASE_URL is set', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

    const mockEvents = [
      {
        uid: 'test-event-1@example.com',
        title: 'Test Event',
        date: '2024-01-01',
        location: 'Test Location',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: mockEvents }),
    } as Response);

    await getEvents();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/events',
      {
        next: { revalidate: 3600 },
      },
    );

    process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
  });

  it('should throw error when response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(getEvents()).rejects.toThrow('Failed to fetch events');
  });

  it('should throw error when fetch fails', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    await expect(getEvents()).rejects.toThrow('Network error');
  });
});
