import { z } from 'zod';

// Schema for iCal event data
export const ICalEventSchema = z.object({
  uid: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.date(),
  end: z.date().optional(),
  url: z.string().optional(),
  status: z.enum(['TENTATIVE', 'CONFIRMED', 'CANCELLED']).optional(),
});

export type ICalEvent = z.infer<typeof ICalEventSchema>;

// Schema for parsed iCal data
export const ICalDataSchema = z.object({
  events: z.array(ICalEventSchema),
  calendarName: z.string().optional(),
  timezone: z.string().optional(),
});

export type ICalData = z.infer<typeof ICalDataSchema>;

// Interface for parsed iCal calendar component
export type ICalCalendarComponent = {
  prodid?: string;
  timezone?: {
    tzid?: string;
  };
};

// Error types for iCal parsing
export const ICalParseErrorSchema = z.object({
  type: z.enum([
    'INVALID_URL',
    'FETCH_ERROR',
    'PARSE_ERROR',
    'VALIDATION_ERROR',
  ]),
  message: z.string(),
  details: z.string().optional(),
});

export type ICalParseError = z.infer<typeof ICalParseErrorSchema>;

// Result type for iCal parsing operations
export type ICalParseResult =
  | { success: true; data: ICalData }
  | { success: false; error: ICalParseError };
