'use client';

import { CalendarEvent } from '@/types/stress';

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private gapi: any = null;
  private isSignedIn = false;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Wait for gapi to load if it's not ready
      if (typeof window === 'undefined') return false;

      // Wait for gapi to be available
      await this.waitForGapi();

      this.gapi = (window as any).gapi;

      // Load auth2 and client
      await new Promise<void>((resolve) => {
        this.gapi.load('auth2', resolve);
      });

      await new Promise<void>((resolve) => {
        this.gapi.load('client', resolve);
      });

      // Initialize the client
      await this.gapi.client.init({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
      });

      const authInstance = this.gapi.auth2.getAuthInstance();
      this.isSignedIn = authInstance?.isSignedIn?.get() || false;

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      return false;
    }
  }

  private waitForGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkGapi = () => {
        if ((window as any).gapi) {
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };

      // Start checking
      checkGapi();

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Google API failed to load')), 10000);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.gapi) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        console.error('Google Auth instance not available');
        return false;
      }

      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Failed to sign in to Google Calendar:', error);
      return false;
    }
  }

  async getUpcomingEvents(hoursAhead: number = 24): Promise<CalendarEvent[]> {
    try {
      if (!this.isSignedIn) {
        const signedIn = await this.signIn();
        if (!signedIn) {
          return [];
        }
      }

      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setHours(timeMax.getHours() + hoursAhead);

      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      return [];
    }
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    try {
      if (!this.isSignedIn) {
        const signedIn = await this.signIn();
        if (!signedIn) {
          return [];
        }
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Failed to fetch today\'s events:', error);
      return [];
    }
  }

  isAuthenticated(): boolean {
    return this.isSignedIn;
  }

  // Helper method to analyze calendar events for stress factors
  analyzeEventsForStress(events: CalendarEvent[]): {
    density: number;
    backToBackCount: number;
    meetingTypes: string[];
    totalDuration: number;
  } {
    if (!events.length) {
      return {
        density: 0,
        backToBackCount: 0,
        meetingTypes: [],
        totalDuration: 0
      };
    }

    // Sort events by start time
    const sortedEvents = events
      .filter(event => event.start?.dateTime)
      .sort((a, b) => {
        const aTime = new Date(a.start.dateTime!).getTime();
        const bTime = new Date(b.start.dateTime!).getTime();
        return aTime - bTime;
      });

    let backToBackCount = 0;
    let totalDuration = 0;
    const meetingTypes: string[] = [];

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];

      // Calculate duration
      if (event.start.dateTime && event.end.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        totalDuration += duration;
      }

      // Analyze meeting type
      const summary = event.summary?.toLowerCase() || '';
      if (summary.includes('interview') || summary.includes('presentation')) {
        meetingTypes.push('high-stakes');
      } else if (summary.includes('standup') || summary.includes('sync')) {
        meetingTypes.push('routine');
      } else if (summary.includes('1:1') || summary.includes('one-on-one')) {
        meetingTypes.push('personal');
      } else if (event.attendees && event.attendees.length > 5) {
        meetingTypes.push('large-group');
      } else {
        meetingTypes.push('meeting');
      }

      // Check for back-to-back meetings
      if (i < sortedEvents.length - 1) {
        const currentEnd = new Date(event.end?.dateTime || '');
        const nextStart = new Date(sortedEvents[i + 1].start?.dateTime || '');
        const gap = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // minutes

        if (gap <= 15) { // 15 minutes or less gap
          backToBackCount++;
        }
      }
    }

    // Calculate density (events per hour in an 8-hour workday)
    const density = events.length / 8;

    return {
      density,
      backToBackCount,
      meetingTypes: [...new Set(meetingTypes)],
      totalDuration
    };
  }
}

export const calendarService = GoogleCalendarService.getInstance();