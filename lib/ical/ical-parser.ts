import type { EventData } from '@/services/events';
import ical from 'node-ical';
import { z } from 'zod';
import { ICAL_CONFIG, ICAL_FEEDS } from './ical-config';
import {
  ICalDataSchema,
  ICalEventSchema,
  type ICalCalendarComponent,
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

  // Calculate date boundaries for filtering
  const now = new Date();
  const minDate = new Date(
    now.getTime() + ICAL_CONFIG.minDaysInFuture * 24 * 60 * 60 * 1000,
  );
  const maxDate = new Date(
    now.getTime() + ICAL_CONFIG.maxDaysInFuture * 24 * 60 * 60 * 1000,
  );

  for (const key in parsed) {
    const component = parsed[key];

    // Only process VEVENT components
    if (component.type === 'VEVENT') {
      // Check if event date is within the configured range
      const eventStart = component.start
        ? new Date(component.start)
        : new Date();
      if (eventStart < minDate || eventStart > maxDate) {
        continue; // Skip events outside the date range
      }
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
    calendarName:
      (parsed.vcalendar as ICalCalendarComponent)?.prodid || undefined,
    timezone:
      (parsed.vcalendar as ICalCalendarComponent)?.timezone?.tzid || undefined,
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
export function convertIcalEventsToEvents(
  icalData: ICalData,
  feedName: string,
): EventData[] {
  return icalData.events
    .map((event) => {
      // Format date as YYYY-MM-DD
      const date = event.start.toISOString().split('T')[0];

      // Format times as HH:MM
      const start = event.start.toTimeString().slice(0, 5);
      const end = event.end ? event.end.toTimeString().slice(0, 5) : undefined;

      return {
        uid: event.uid,
        title: event.summary,
        date,
        location: feedName, // Use the feed name as the location
        description: event.description,
        start,
        end,
      };
    })
    .slice(0, ICAL_CONFIG.maxEventsPerFeed); // Limit to maxEventsPerFeed
}

/**
 * Result type for individual feed processing
 */
type FeedResult = {
  name: string;
  success: boolean;
  events: EventData[];
  error?: string;
};

/**
 * Parses iCal feeds in parallel and merges the results
 */
export async function parseIcalFeeds(): Promise<{
  events: EventData[];
  feedResults: FeedResult[];
}> {
  console.log(`Processing ${ICAL_FEEDS.length} iCal feeds...`);

  // Process all feeds in parallel
  const feedPromises = ICAL_FEEDS.map(async (feed): Promise<FeedResult> => {
    console.log(`Fetching events from ${feed.name}...`);

    try {
      const result = await parseIcalFromUrl(feed.url);

      if (!result.success) {
        console.warn(
          `Failed to parse feed ${feed.name}:`,
          result.error.message,
        );
        return {
          name: feed.name,
          success: false,
          events: [],
          error: result.error.message,
        };
      }

      const events = convertIcalEventsToEvents(result.data, feed.name);
      console.log(
        `Successfully fetched ${events.length} events from ${feed.name}`,
      );

      return {
        name: feed.name,
        success: true,
        events,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing feed ${feed.name}:`, errorMessage);

      return {
        name: feed.name,
        success: false,
        events: [],
        error: errorMessage,
      };
    }
  });

  // Wait for all feeds to complete (using allSettled to handle partial failures)
  const feedResults = await Promise.allSettled(feedPromises);

  // Extract results and handle any unexpected rejections
  const processedResults: FeedResult[] = feedResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const feedName = ICAL_FEEDS[index]?.name || `Feed ${index + 1}`;
      console.error(
        `Unexpected rejection for feed ${feedName}:`,
        result.reason,
      );
      return {
        name: feedName,
        success: false,
        events: [],
        error:
          result.reason instanceof Error
            ? result.reason.message
            : 'Unexpected error',
      };
    }
  });

  // Merge all successful events
  const allEvents = processedResults
    .filter((result) => result.success)
    .flatMap((result) => result.events);

  // Sort events by date and time
  allEvents.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;

    // If same date, sort by start time
    const aStart = a.start || '00:00';
    const bStart = b.start || '00:00';
    return aStart.localeCompare(bStart);
  });

  const successfulFeeds = processedResults.filter(
    (result) => result.success,
  ).length;
  const failedFeeds = processedResults.filter(
    (result) => !result.success,
  ).length;

  console.log(
    `Feed processing complete: ${successfulFeeds} successful, ${failedFeeds} failed, ${allEvents.length} total events`,
  );

  return {
    events: allEvents,
    feedResults: processedResults,
  };
}
