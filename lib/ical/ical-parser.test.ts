import {
  convertIcalToUndergroundEvents,
  parseIcalFromUrl,
} from '@/lib/ical/ical-parser';
import type {
  CalendarComponentI,
  ICalData,
  ICalEvent,
} from '@/lib/ical/types/ical';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock types for node-ical
interface MockVEvent extends ICalEvent {
  type: 'VEVENT';
}

interface MockCalendarResponse {
  [key: string]: MockVEvent | CalendarComponentI;
  vcalendar: CalendarComponentI;
}

// Mock node-ical
vi.mock('node-ical', () => ({
  default: {
    parseICS: vi.fn(),
  },
}));

// Import the mocked module
import ical from 'node-ical';

// Mock fetch
global.fetch = vi.fn();

describe('iCal Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseIcalFromUrl', () => {
    it('should successfully parse valid iCal data', async () => {
      const mockIcalData = `BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//Test//Test//EN
        BEGIN:VEVENT
        UID:test-event-1@example.com
        SUMMARY:Test Event
        DESCRIPTION:This is a test event
        LOCATION:Test Location
        DTSTART:20240101T120000Z
        DTEND:20240101T140000Z
        URL:https://example.com/event
        END:VEVENT
        END:VCALENDAR`;

      const mockParsedData: MockCalendarResponse = {
        'test-event-1@example.com': {
          type: 'VEVENT',
          uid: 'test-event-1@example.com',
          summary: 'Test Event',
          description: 'This is a test event',
          location: 'Test Location',
          start: new Date('2024-01-01T12:00:00Z'),
          end: new Date('2024-01-01T14:00:00Z'),
          url: 'https://example.com/event',
        },
        vcalendar: {
          prodid: '-//Test//Test//EN',
          timezone: {
            tzid: 'UTC',
          },
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockIcalData),
      } as Response);

      vi.mocked(ical.parseICS).mockReturnValue(
        mockParsedData as unknown as ReturnType<typeof ical.parseICS>,
      );

      const result = await parseIcalFromUrl('https://example.com/calendar.ics');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(1);
        expect(result.data.events[0].uid).toBe('test-event-1@example.com');
        expect(result.data.events[0].summary).toBe('Test Event');
        expect(result.data.calendarName).toBe('-//Test//Test//EN');
        expect(result.data.timezone).toBe('UTC');
      }
    });

    it('should handle fetch errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await parseIcalFromUrl('https://example.com/calendar.ics');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PARSE_ERROR');
        expect(result.error.message).toBe('Network error');
      }
    });

    it('should handle invalid iCal data', async () => {
      const mockIcalData = 'invalid ical data';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockIcalData),
      } as Response);

      vi.mocked(ical.parseICS).mockImplementation(() => {
        throw new Error('Invalid iCal data');
      });

      const result = await parseIcalFromUrl('https://example.com/calendar.ics');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PARSE_ERROR');
        expect(result.error.message).toBe('Invalid iCal data');
      }
    });

    it('should handle HTTP errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await parseIcalFromUrl('https://example.com/calendar.ics');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FETCH_ERROR');
        expect(result.error.message).toContain('404');
      }
    });

    it('should skip invalid events and continue parsing', async () => {
      const mockParsedData: MockCalendarResponse = {
        'valid-event@example.com': {
          type: 'VEVENT',
          uid: 'valid-event@example.com',
          summary: 'Valid Event',
          start: new Date('2024-01-01T12:00:00Z'),
        },
        'invalid-event@example.com': {
          type: 'VEVENT',
          uid: 'invalid-event@example.com',
          summary: 'Invalid Event', // Add summary to make it valid
          start: new Date('2024-01-01T12:00:00Z'),
        },
        vcalendar: {
          prodid: '-//Test//Test//EN',
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock data'),
      } as Response);

      vi.mocked(ical.parseICS).mockReturnValue(
        mockParsedData as unknown as ReturnType<typeof ical.parseICS>,
      );

      const result = await parseIcalFromUrl('https://example.com/calendar.ics');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(2);
        expect(result.data.events[0].uid).toBe('valid-event@example.com');
        expect(result.data.events[1].uid).toBe('invalid-event@example.com');
      }
    });
  });

  describe('convertIcalToUndergroundEvents', () => {
    it('should convert iCal events to underground event format', () => {
      const mockIcalData: ICalData = {
        events: [
          {
            uid: 'test-event-1@example.com',
            summary: 'Test Event',
            description: 'This is a test event',
            location: 'Test Location',
            start: new Date('2024-01-01T12:00:00Z'),
            end: new Date('2024-01-01T14:00:00Z'),
            url: 'https://example.com/event',
          },
        ],
        calendarName: 'Test Calendar',
        timezone: 'UTC',
      };

      const result = convertIcalToUndergroundEvents(mockIcalData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uid: 'test-event-1@example.com',
        title: 'Test Event',
        date: '2024-01-01',
        location: 'Test Location',
        description: 'This is a test event',
        start: '13:00', // UTC+1 in local timezone
        end: '15:00', // UTC+1 in local timezone
      });
    });

    it('should handle events without end time', () => {
      const mockIcalData: ICalData = {
        events: [
          {
            uid: 'test-event-2@example.com',
            summary: 'Test Event No End',
            start: new Date('2024-01-01T12:00:00Z'),
          },
        ],
        calendarName: 'Test Calendar',
      };

      const result = convertIcalToUndergroundEvents(mockIcalData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uid: 'test-event-2@example.com',
        title: 'Test Event No End',
        date: '2024-01-01',
        location: 'TBA',
        description: undefined,
        start: '13:00', // UTC+1 in local timezone
        end: undefined,
      });
    });

    it('should handle events without location', () => {
      const mockIcalData: ICalData = {
        events: [
          {
            uid: 'test-event-3@example.com',
            summary: 'Test Event No Location',
            start: new Date('2024-01-01T12:00:00Z'),
          },
        ],
        calendarName: 'Test Calendar',
      };

      const result = convertIcalToUndergroundEvents(mockIcalData);

      expect(result).toHaveLength(1);
      expect(result[0].location).toBe('TBA');
    });
  });
});
