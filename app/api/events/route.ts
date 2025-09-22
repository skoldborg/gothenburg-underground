import {
  convertIcalToUndergroundEvents,
  parseIcalFromUrl,
} from '@/lib/ical/ical-parser';
import { NextResponse } from 'next/server';

const ICAL_URL =
  'https://www.monument031.com/?post_type=tribe_events&ical=1&eventDisplay=list';

export async function GET() {
  try {
    const result = await parseIcalFromUrl(ICAL_URL);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    const events = convertIcalToUndergroundEvents(result.data);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}
