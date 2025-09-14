'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw } from 'lucide-react';

interface MoodData {
  mood: string;
  intensity: number; // 1-10 scale
  timestamp: Date;
  factors: string[];
  energy: number; // 1-10 scale
}

const moodEmojis: { [key: string]: string } = {
  'happy': '😊',
  'excited': '🤗',
  'calm': '😌',
  'focused': '🧠',
  'tired': '😴',
  'stressed': '😰',
  'anxious': '😟',
  'sad': '😢',
  'neutral': '😐'
};

export default function MoodTracker() {
  const [, setMounted] = useState(false);
  const [currentMood, setCurrentMood] = useState<MoodData>({
    mood: 'calm',
    intensity: 7,
    timestamp: new Date(),
    factors: ['work', 'sleep'],
    energy: 6
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMoodData = async () => {
    setIsLoading(true);
    
    // API call placeholder - commented out for now
    /*
    try {
      const response = await fetch('/api/mood/current');
      const data = await response.json();
      setCurrentMood(data);
    } catch (error) {
      console.error('Failed to fetch mood data:', error);
    }
    */

    // Simulate API call
    setTimeout(() => {
      const moods = ['happy', 'excited', 'calm', 'focused', 'tired', 'stressed', 'anxious', 'neutral'];
      const factors = ['work', 'sleep', 'exercise', 'social', 'weather', 'health'];
      
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      const randomFactors = factors
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);

      setCurrentMood({
        mood: randomMood,
        intensity: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date(),
        factors: randomFactors,
        energy: Math.floor(Math.random() * 10) + 1
      });
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchMoodData();
    
    // Poll for mood updates every 30 seconds
    const interval = setInterval(fetchMoodData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (intensity >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (intensity >= 4) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getEnergyLevel = (energy: number) => {
    if (energy >= 8) return 'High';
    if (energy >= 6) return 'Moderate';
    if (energy >= 4) return 'Low';
    return 'Very Low';
  };

  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>Current Mood</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMoodData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Real-time mood analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">
              {moodEmojis[currentMood.mood] || '😐'}
            </div>
            <h3 className="text-xl font-semibold capitalize">
              {currentMood.mood}
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Intensity</span>
            <Badge className={getIntensityColor(currentMood.intensity)}>
              {currentMood.intensity}/10
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Energy Level</span>
            <Badge variant="outline">
              {getEnergyLevel(currentMood.energy)}
            </Badge>
          </div>

          <div>
            <span className="text-sm font-medium">Influencing Factors</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentMood.factors.map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Last updated: {currentMood.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}