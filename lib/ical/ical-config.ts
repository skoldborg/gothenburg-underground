/**
 * Configuration for iCal feeds
 * Add your iCal URLs here to automatically fetch events
 */
export const ICAL_FEEDS = [
  // Example iCal URLs - replace with actual URLs
  // 'https://example.com/calendar.ics',
  // 'https://another-venue.com/events.ics',
] as const;

/**
 * Configuration for event filtering and processing
 */
export const ICAL_CONFIG = {
  // Maximum number of events to fetch per feed
  maxEventsPerFeed: 50,

  // Maximum number of days in the future to fetch events
  maxDaysInFuture: 365,

  // Minimum number of days in the future to fetch events (skip past events)
  minDaysInFuture: 0,

  // Default timezone for events without timezone info
  defaultTimezone: 'Europe/Stockholm',
} as const;
