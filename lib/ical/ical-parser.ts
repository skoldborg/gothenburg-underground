import ical from 'node-ical';
import { z } from 'zod';
import {
  ICalDataSchema,
  ICalEventSchema,
  type CalendarComponentI,
  type ICalData,
  type ICalParseError,
  type ICalParseResult,
} from './types/ical';

/**
 * Fetches iCal data from a URL
 */
async function fetchIcalData(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch iCal data: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

/**
 * Parses raw iCal data and extracts events
 */
function parseIcalData(rawData: string): ICalData {
  const parsed = ical.parseICS(rawData);
  const events: Array<z.infer<typeof ICalEventSchema>> = [];

  for (const key in parsed) {
    const component = parsed[key];

    // Only process VEVENT components
    if (component.type === 'VEVENT') {
      try {
        // Transform the parsed event to match our schema
        const eventData = {
          uid: component.uid || key,
          summary: component.summary || 'Untitled Event',
          description: component.description,
          location: component.location,
          start: component.start ? new Date(component.start) : new Date(),
          end: component.end ? new Date(component.end) : undefined,
          url: component.url,
        };

        // Validate the event data
        const validatedEvent = ICalEventSchema.parse(eventData);
        events.push(validatedEvent);
      } catch (error) {
        // Skip invalid events but log the error
        console.warn(`Skipping invalid event ${key}:`, error);
      }
    }
  }

  return {
    events,
    calendarName: (parsed.vcalendar as CalendarComponentI)?.prodid || undefined,
    timezone:
      (parsed.vcalendar as CalendarComponentI)?.timezone?.tzid || undefined,
  };
}

/**
 * Main function to parse iCal data from a URL
 */
export async function parseIcalFromUrl(url: string): Promise<ICalParseResult> {
  try {
    // Fetch the iCal data
    const rawData = await fetchIcalData(url);

    // Parse the iCal data
    const parsedData = parseIcalData(rawData);

    // Validate the final result
    const validatedData = ICalDataSchema.parse(parsedData);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    let errorType: ICalParseError['type'] = 'PARSE_ERROR';
    let message = 'Unknown error occurred';
    let details: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      details = error.stack;

      if (message.includes('fetch')) {
        errorType = 'FETCH_ERROR';
      } else if (message.includes('parse') || message.includes('Invalid')) {
        errorType = 'PARSE_ERROR';
      }
    }

    return {
      success: false,
      error: {
        type: errorType,
        message,
        details,
      },
    };
  }
}

/**
 * Converts iCal events to our UndergroundEvent format
 */
export function convertIcalToUndergroundEvents(icalData: ICalData): Array<{
  uid: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  start?: string;
  end?: string;
}> {
  return icalData.events.map((event) => {
    // Format date as YYYY-MM-DD
    const date = event.start.toISOString().split('T')[0];

    // Format times as HH:MM
    const start = event.start.toTimeString().slice(0, 5);
    const end = event.end ? event.end.toTimeString().slice(0, 5) : undefined;

    return {
      uid: event.uid,
      title: event.summary,
      date,
      location: event.location || 'TBA',
      description: event.description,
      start,
      end,
    };
  });
}
