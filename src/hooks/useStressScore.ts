'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StressContext, StressAnalysis, StressHistory, EmailEvent } from '@/types/stress';
import { calendarService } from '@/lib/calendar-api';
import { supabase } from '@/lib/supabase';
import { useWellnessData } from './useWellnessData';

export function useStressScore() {
  const [stressScore, setStressScore] = useState(3); // Default to your existing default
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<StressHistory[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Keep track of previous context for comparison
  const previousContextRef = useRef<StressContext | null>(null);
  const computationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get today's wellness data from intervals.icu
  const { getStressMetrics } = useWellnessData();

  // Fetch current heart rate from your existing logic
  const fetchCurrentHeartRate = useCallback(async (): Promise<number> => {
    try {
      const { data } = await supabase
        .from('physio_measurements')
        .select('value')
        .eq('metric', 'heart_rate')
        .order('ts', { ascending: false })
        .limit(1);

      return data && data.length > 0 ? Math.round(data[0].value) : 72;
    } catch (error) {
      console.error('Error fetching heart rate:', error);
      return 72;
    }
  }, []);

  // Fetch Gmail events from your existing logic
  const fetchGmailEvents = useCallback(async (): Promise<EmailEvent[]> => {
    try {
      const { data } = await supabase
        .from('events')
        .select('event_id, ts_range, start_at, end_at, details, ingested_at')
        .order('ingested_at', { ascending: false })
        .limit(10);

      return data || [];
    } catch (err) {
      console.error('Error fetching Gmail events:', err);
      return [];
    }
  }, []);

  // Create context for LLM reasoning - simplified without calendar for now
  const buildStressContext = useCallback(async (): Promise<StressContext> => {
    const [heartRate, emails] = await Promise.all([
      fetchCurrentHeartRate(),
      fetchGmailEvents()
    ]);

    const now = new Date();
    const timeOfDay = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      weekday: 'long'
    });

    return {
      timestamp: now,
      heartRate,
      recentEmails: emails,
      calendarEvents: [], // Skip calendar for now
      timeOfDay,
      previousScore: stressScore,
      previousReasoning: reasoning
    };
  }, [fetchCurrentHeartRate, fetchGmailEvents, stressScore, reasoning, getStressMetrics]);

  // LLM-powered stress computation
  const computeStressScore = useCallback(async (context: StressContext): Promise<StressAnalysis> => {
    try {
      // Build comprehensive prompt for LLM reasoning
      const calendarAnalysis = calendarService.analyzeEventsForStress(context.calendarEvents);

      const systemPrompt = `You are a stress assessment AI that analyzes a person's current situation to compute a stress score from 0-6:
0: 😊 Relaxed - Very low stress
1: 🙂 Calm - Low stress
2: 😐 Neutral - Slightly tense
3: 😑 Tense - Moderate stress (default)
4: 😬 Stressed - High stress
5: 😰 Very Stressed - Very high stress
6: 🤯 Overwhelmed - Maximum stress

Consider these factors:
- Heart rate
- Calendar density and meeting types
- Time pressure and upcoming deadlines
- Email volume and urgency
- Time of day and energy patterns
- Previous stress state for continuity

Respond with a JSON object containing:
{
  "score": number (0-6),
  "reasoning": "Brief explanation of the score",
  "confidence": number (0-1)
}`;

      const userPrompt = `Current situation:
Time: ${context.timeOfDay}
Heart Rate: ${context.heartRate} BPM
Previous Stress: ${context.previousScore}/6 - "${context.previousReasoning}"

Calendar Analysis:
- Events in next 8 hours: ${context.calendarEvents.length}
- Meeting density: ${calendarAnalysis.density.toFixed(1)} events/hour
- Back-to-back meetings: ${calendarAnalysis.backToBackCount}
- Total meeting time: ${Math.round(calendarAnalysis.totalDuration)} minutes
- Meeting types: ${calendarAnalysis.meetingTypes.join(', ')}

Recent Email Activity:
- Recent emails: ${context.recentEmails.length}
- Latest email: ${context.recentEmails[0] ? new Date(context.recentEmails[0].ingested_at).toLocaleTimeString() : 'None'}

Upcoming Calendar Events:
${context.calendarEvents.slice(0, 5).map(event => {
  const start = event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString() : 'All day';
  return `- ${start}: ${event.summary}`;
}).join('\n')}

Assess current stress level considering physiological data, schedule pressure, and workload.`;

      // Create a dedicated API route for stress computation instead of using suggestions
      const wellnessMetrics = getStressMetrics();
      console.log('🏥 Wellness data being sent to LLM:', wellnessMetrics);

      const payload = {
        heartRate: context.heartRate,
        timeOfDay: context.timeOfDay,
        events: context.recentEmails,
        previousScore: context.previousScore,
        previousReasoning: context.previousReasoning,
        wellnessData: wellnessMetrics
      };

      console.log('📤 Full payload to stress API:', payload);

      const response = await fetch('/api/stress-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to compute stress score');
      }

      const result = await response.json();

      // The API route now returns properly structured data
      const analysis: StressAnalysis = {
        score: result.score,
        reasoning: result.reasoning,
        factors: [], // Could be expanded later
        confidence: result.confidence
      };

      return analysis;
    } catch (error) {
      console.error('Error computing stress score:', error);
      return {
        score: 3,
        reasoning: 'Unable to compute stress score at this time',
        factors: [],
        confidence: 0.1
      };
    }
  }, []);

  // Check if context has changed significantly
  const hasSignificantChange = useCallback((newContext: StressContext): boolean => {
    if (!previousContextRef.current) return true;

    const prev = previousContextRef.current;

    // Check heart rate change (significant = 8+ BPM difference)
    const hrChange = Math.abs(newContext.heartRate - prev.heartRate);
    if (hrChange >= 8) {
      console.log(`🫀 Heart rate changed by ${hrChange} BPM - updating stress`);
      return true;
    }

    // Check email changes (new emails arrived)
    if (newContext.recentEmails.length !== prev.recentEmails.length) {
      console.log(`📧 Email count changed: ${prev.recentEmails.length} → ${newContext.recentEmails.length}`);
      return true;
    }

    // Much more aggressive time-based updates
    const timeDiff = newContext.timestamp.getTime() - prev.timestamp.getTime();
    const isWorkHours = newContext.timestamp.getHours() >= 9 && newContext.timestamp.getHours() <= 18;

    // During work hours - update every 30 seconds for real-time stress tracking
    if (isWorkHours && timeDiff >= 30 * 1000) {
      console.log('⏰ 30-second work hours update');
      return true;
    }

    // Evening hours (6PM-11PM) - update every 2 minutes
    const isEveningHours = newContext.timestamp.getHours() >= 18 && newContext.timestamp.getHours() <= 23;
    if (isEveningHours && timeDiff >= 2 * 60 * 1000) {
      console.log('🌆 2-minute evening update');
      return true;
    }

    // Late night/early morning - update every 5 minutes
    if (!isWorkHours && !isEveningHours && timeDiff >= 5 * 60 * 1000) {
      console.log('🌙 5-minute off-hours update');
      return true;
    }

    return false;
  }, []);

  // Main computation trigger
  const updateStressScore = useCallback(async (force = false) => {
    if (loading) return;

    const context = await buildStressContext();

    // Always allow first run, then check for changes
    if (!force && previousContextRef.current && !hasSignificantChange(context)) {
      return;
    }

    setLoading(true);

    try {
      const analysis = await computeStressScore(context);

      setStressScore(analysis.score);
      setReasoning(analysis.reasoning);
      setLastUpdate(new Date());

      // Add to history
      const historyEntry: StressHistory = {
        timestamp: context.timestamp,
        score: analysis.score,
        reasoning: analysis.reasoning,
        context
      };

      setHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 entries
      previousContextRef.current = context;

    } finally {
      setLoading(false);
    }
  }, [loading, buildStressContext, hasSignificantChange, computeStressScore]);

  // Auto-update logic
  useEffect(() => {
    // Initial computation
    updateStressScore(true);

    // Set up periodic updates
    const interval = setInterval(() => {
      updateStressScore();
    }, 30 * 1000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      const timeoutId = computationTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [updateStressScore]);

  // Manual refresh function
  const refresh = useCallback(() => {
    updateStressScore(true);
  }, [updateStressScore]);

  return {
    stressScore,
    reasoning,
    loading,
    history,
    lastUpdate,
    refresh,
    // For debugging
    context: previousContextRef.current
  };
}