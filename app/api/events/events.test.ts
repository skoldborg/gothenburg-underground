import { GET } from '@/app/api/events/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the iCal parser
vi.mock('@/lib/ical/ical-parser', () => ({
  parseIcalFeeds: vi.fn(),
}));

// Import the mocked function
import { parseIcalFeeds } from '@/lib/ical/ical-parser';

describe('/api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return events on successful parsing', async () => {
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

    const mockFeedResults = [
      {
        name: 'Test Feed',
        success: true,
        events: mockEvents,
      },
    ];

    vi.mocked(parseIcalFeeds).mockResolvedValue({
      events: mockEvents,
      feedResults: mockFeedResults,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toEqual(mockEvents);
    expect(data._metadata).toEqual({
      totalFeeds: 1,
      successfulFeeds: 1,
      failedFeeds: 0,
      totalEvents: 1,
    });
    expect(parseIcalFeeds).toHaveBeenCalled();
  });

  it('should return error when parsing fails', async () => {
    vi.mocked(parseIcalFeeds).mockRejectedValue(
      new Error('Failed to fetch events'),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch events');
  });

  it('should handle partial feed failures gracefully', async () => {
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

    const mockFeedResults = [
      {
        name: 'Successful Feed',
        success: true,
        events: mockEvents,
      },
      {
        name: 'Failed Feed',
        success: false,
        events: [],
        error: 'Network error',
      },
    ];

    vi.mocked(parseIcalFeeds).mockResolvedValue({
      events: mockEvents,
      feedResults: mockFeedResults,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toEqual(mockEvents);
    expect(data._metadata).toEqual({
      totalFeeds: 2,
      successfulFeeds: 1,
      failedFeeds: 1,
      totalEvents: 1,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Some feeds failed to load:', [
      'Failed Feed: Network error',
    ]);

    consoleSpy.mockRestore();
  });

  it('should handle unexpected errors', async () => {
    vi.mocked(parseIcalFeeds).mockRejectedValue(new Error('Unexpected error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch events');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching events:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
