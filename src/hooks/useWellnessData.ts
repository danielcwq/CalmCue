'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WellnessData {
  id: string;
  ctl: number;
  atl: number;
  rampRate: number;
  ctlLoad: number;
  atlLoad: number;
  updated: string;
  weight: number;
  restingHR: number;
  hrv: number;
  hrvSDNN: number;
  kcalConsumed: number;
  sleepSecs: number;
  sleepScore: number;
  sleepQuality: number;
  avgSleepingHR: number;
  soreness: number;
  fatigue: number;
  stress: number;
  mood: number;
  motivation: number;
  injury: number;
  spO2: number;
  systolic: number;
  diastolic: number;
  hydration: number;
  hydrationVolume: number;
  readiness: number;
  baevskySI: number;
  bloodGlucose: number;
  lactate: number;
  bodyFat: number;
  abdomen: number;
  vo2max: number;
  comments: string;
  steps: number;
  respiration: number;
  locked: boolean;
}

export function useWellnessData(date?: string) {
  const [wellnessData, setWellnessData] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchWellnessData = useCallback(async (targetDate?: string) => {
    setLoading(true);
    setError(null);

    try {
      const dateParam = targetDate || date || new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/wellness?date=${dateParam}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch wellness data: ${response.status}`);
      }

      const data = await response.json();
      setWellnessData(data);
      setLastFetch(new Date());

    } catch (err) {
      console.error('Error fetching wellness data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setWellnessData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchWellnessData();
  }, [fetchWellnessData]);

  // Refresh wellness data (can be called manually)
  const refresh = useCallback(() => {
    fetchWellnessData();
  }, [fetchWellnessData]);

  return {
    wellnessData,
    loading,
    error,
    lastFetch,
    refresh,
    // Helper functions to extract key metrics
    getStressMetrics: () => wellnessData ? {
      hrv: wellnessData.hrv,
      restingHR: wellnessData.restingHR,
      sleepScore: wellnessData.sleepScore,
      sleepQuality: wellnessData.sleepQuality,
      stress: wellnessData.stress,
      fatigue: wellnessData.fatigue,
      soreness: wellnessData.soreness,
      mood: wellnessData.mood,
      motivation: wellnessData.motivation,
      readiness: wellnessData.readiness
    } : null,

    getTrainingMetrics: () => wellnessData ? {
      ctl: wellnessData.ctl,
      atl: wellnessData.atl,
      rampRate: wellnessData.rampRate
    } : null
  };
}