import { GET } from '@/app/api/events/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the iCal parser
vi.mock('@/lib/ical/ical-parser', () => ({
  parseIcalFromUrl: vi.fn(),
  convertIcalToUndergroundEvents: vi.fn(),
}));

describe('/api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return events on successful parsing', async () => {
    const mockIcalData = {
      events: [
        {
          uid: 'test-event-1@example.com',
          summary: 'Test Event',
          description: 'Test Description',
          location: 'Test Location',
          start: new Date('2024-01-01T12:00:00Z'),
          end: new Date('2024-01-01T14:00:00Z'),
        },
      ],
      calendarName: 'Test Calendar',
      timezone: 'UTC',
    };

    const mockUndergroundEvents = [
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

    const { parseIcalFromUrl, convertIcalToUndergroundEvents } = await import(
      '@/lib/ical/ical-parser'
    );

    vi.mocked(parseIcalFromUrl).mockResolvedValue({
      success: true,
      data: mockIcalData,
    });

    vi.mocked(convertIcalToUndergroundEvents).mockReturnValue(
      mockUndergroundEvents,
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toEqual(mockUndergroundEvents);
    expect(convertIcalToUndergroundEvents).toHaveBeenCalledWith(mockIcalData);
  });

  it('should return error when parsing fails', async () => {
    const { parseIcalFromUrl } = await import('@/lib/ical/ical-parser');

    vi.mocked(parseIcalFromUrl).mockResolvedValue({
      success: false,
      error: {
        type: 'FETCH_ERROR',
        message: 'Failed to fetch iCal data',
        details: 'Network error',
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch iCal data');
  });

  it('should handle unexpected errors', async () => {
    const { parseIcalFromUrl } = await import('@/lib/ical/ical-parser');

    vi.mocked(parseIcalFromUrl).mockRejectedValue(
      new Error('Unexpected error'),
    );

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
