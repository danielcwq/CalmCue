'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStressScore } from '@/hooks/useStressScore';
import { calendarService } from '@/lib/calendar-api';
import { Brain, Calendar, Heart, RefreshCw, Clock, TrendingUp, Activity } from 'lucide-react';

export default function StressAnalysisPage() {
  const [mounted, setMounted] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const { stressScore, reasoning, loading, history, lastUpdate, refresh, context } = useStressScore();

  // Your existing stress emojis
  const stressEmojis = useMemo(() => [
    { emoji: '😊', label: 'Relaxed', color: 'text-green-500' },      // 0
    { emoji: '🙂', label: 'Calm', color: 'text-green-400' },        // 1
    { emoji: '😐', label: 'Neutral', color: 'text-yellow-500' },    // 2
    { emoji: '😑', label: 'Tense', color: 'text-yellow-600' },      // 3
    { emoji: '😬', label: 'Stressed', color: 'text-orange-500' },   // 4
    { emoji: '😰', label: 'Very Stressed', color: 'text-red-500' }, // 5
    { emoji: '🤯', label: 'Overwhelmed', color: 'text-red-600' }    // 6
  ], []);

  useEffect(() => {
    setMounted(true);
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    const initialized = await calendarService.initialize();
    setCalendarConnected(initialized && calendarService.isAuthenticated());
  };

  const connectCalendar = async () => {
    const success = await calendarService.signIn();
    setCalendarConnected(success);
    if (success) {
      // Trigger immediate refresh after calendar connection
      setTimeout(() => refresh(), 1000);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 p-4">Loading...</div>;
  }

  const currentStress = stressEmojis[Math.min(stressScore, 6)];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stress Analysis</h1>
            <p className="text-gray-600">AI-powered stress monitoring with real-time calendar integration</p>
          </div>
          <Button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Calendar Connection Status */}
        {!calendarConnected && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Calendar Not Connected</p>
                    <p className="text-sm text-yellow-700">Connect your Google Calendar for enhanced stress analysis</p>
                  </div>
                </div>
                <Button onClick={connectCalendar} variant="outline" size="sm">
                  Connect Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Stress Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Current Stress Score */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-5 w-5" />
                Current Stress Level
              </CardTitle>
              <CardDescription>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-8xl mb-4">{currentStress.emoji}</div>
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${currentStress.color}`}>
                  {stressScore}/6
                </div>
                <div className="text-lg text-gray-600">
                  {currentStress.label}
                </div>
                <Progress
                  value={(stressScore / 6) * 100}
                  className="w-full h-2 mt-4"
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Current situation assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {reasoning || "Analyzing your current situation..."}
                  </p>
                </div>

                {/* Context Summary */}
                {context && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{context.heartRate} BPM</p>
                        <p className="text-gray-500">Heart Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{context.calendarEvents.length}</p>
                        <p className="text-gray-500">Events Today</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{context.recentEmails.length}</p>
                        <p className="text-gray-500">Recent Emails</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{context.timeOfDay.split(' ')[1]}</p>
                        <p className="text-gray-500">Time of Day</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Calendar Events */}
        {calendarConnected && context && context.calendarEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Events Analysis
              </CardTitle>
              <CardDescription>
                Events that may impact your stress level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {context.calendarEvents.slice(0, 5).map((event, index) => {
                  const startTime = event.start.dateTime
                    ? new Date(event.start.dateTime)
                    : null;

                  const isHighStakes = event.summary?.toLowerCase().includes('presentation') ||
                                     event.summary?.toLowerCase().includes('interview') ||
                                     event.summary?.toLowerCase().includes('demo');

                  return (
                    <div key={event.id || index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.summary}</h4>
                          {isHighStakes && (
                            <Badge variant="destructive" className="text-xs">
                              High Stakes
                            </Badge>
                          )}
                        </div>
                        {startTime && (
                          <p className="text-sm text-gray-500">
                            {startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • {Math.round((startTime.getTime() - new Date().getTime()) / (1000 * 60))} minutes
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {event.attendees && event.attendees.length > 1 && (
                          <p className="text-xs text-gray-500">
                            {event.attendees.length} attendees
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stress History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Stress History
              </CardTitle>
              <CardDescription>
                Recent stress level changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stressEmojis[entry.score].emoji}</span>
                      <div>
                        <p className="font-medium">{stressEmojis[entry.score].label}</p>
                        <p className="text-xs text-gray-500">
                          {entry.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {entry.score}/6
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}