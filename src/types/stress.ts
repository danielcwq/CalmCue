export interface StressContext {
  timestamp: Date;
  heartRate: number;
  recentEmails: EmailEvent[];
  calendarEvents: CalendarEvent[];
  timeOfDay: string;
  previousScore?: number;
  previousReasoning?: string;
}

export interface EmailEvent {
  event_id: string;
  ts_range: any;
  start_at: string;
  end_at: string;
  details: any;
  ingested_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
  conferenceData?: {
    conferenceSolution: {
      name: string;
    };
  };
}

export interface StressAnalysis {
  score: number; // 0-6 to match your existing emoji system
  reasoning: string;
  factors: StressFactor[];
  confidence: number;
}

export interface StressFactor {
  type: 'calendar_density' | 'meeting_type' | 'heart_rate' | 'email_volume' | 'time_pressure';
  impact: number; // -3 to +3 (negative = stress relief, positive = stress increase)
  description: string;
}

export interface StressHistory {
  timestamp: Date;
  score: number;
  reasoning: string;
  context: StressContext;
}