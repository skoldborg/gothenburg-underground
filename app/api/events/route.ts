import { parseIcalFeeds } from '@/lib/ical/ical-parser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await parseIcalFeeds();

    // Log feed processing results for monitoring
    const successfulFeeds = result.feedResults.filter((feed) => feed.success);
    const failedFeeds = result.feedResults.filter((feed) => !feed.success);

    if (failedFeeds.length > 0) {
      console.warn(
        'Some feeds failed to load:',
        failedFeeds.map((feed) => `${feed.name}: ${feed.error}`),
      );
    }

    // Return events even if some feeds failed (graceful degradation)
    return NextResponse.json({
      events: result.events,
      // Include metadata about feed processing for debugging
      _metadata: {
        totalFeeds: result.feedResults.length,
        successfulFeeds: successfulFeeds.length,
        failedFeeds: failedFeeds.length,
        totalEvents: result.events.length,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}
