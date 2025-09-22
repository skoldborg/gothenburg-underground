/**
 * Configuration for iCal feeds
 */
export const ICAL_FEEDS = [
  {
    name: 'Monument 031',
    url: 'https://www.monument031.com/?post_type=tribe_events&ical=1&eventDisplay=list',
  },
] as const;

/**
 * Configuration for event filtering and processing
 */
export const ICAL_CONFIG = {
  // Maximum number of events to fetch per feed
  maxEventsPerFeed: 50,

  // Maximum number of days in the future to fetch events
  maxDaysInFuture: 31,

  // Minimum number of days in the future to fetch events (skip past events)
  minDaysInFuture: 0,

  // Default timezone for events without timezone info
  defaultTimezone: 'Europe/Stockholm',
} as const;
