'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface MoodPrediction {
  timestamp: Date;
  predictedMood: string;
  confidence: number; // 0-100
  trend: 'improving' | 'declining' | 'stable';
  riskFactors: string[];
  recommendations: string[];
}

const trendData = [
  { time: '2h ago', mood: 'calm', intensity: 7 },
  { time: '1h ago', mood: 'focused', intensity: 8 },
  { time: 'now', mood: 'calm', intensity: 7 },
  { time: '+1h', mood: 'stressed', intensity: 4 },
  { time: '+2h', mood: 'tired', intensity: 3 },
];

export default function MoodTrend() {
  const [prediction, setPrediction] = useState<MoodPrediction>({
    timestamp: new Date(),
    predictedMood: 'stressed',
    confidence: 78,
    trend: 'declining',
    riskFactors: ['Meeting at 3 PM', 'Low energy', 'Deadline pressure'],
    recommendations: ['Take a 10-minute break', 'Practice deep breathing', 'Stay hydrated']
  });

  const fetchTrendData = async () => {
    // API call placeholder - commented out for now
    /*
    try {
      const response = await fetch('/api/mood/trend');
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    }
    */

    // Simulate API call with random prediction
    const moods = ['happy', 'calm', 'focused', 'tired', 'stressed', 'anxious'];
    const trends: ('improving' | 'declining' | 'stable')[] = ['improving', 'declining', 'stable'];
    const risks = [
      'Meeting scheduled', 'Deadline approaching', 'Low energy', 'Poor sleep', 
      'High workload', 'Social event', 'Weather change'
    ];
    const recs = [
      'Take a break', 'Practice mindfulness', 'Go for a walk', 'Stay hydrated',
      'Get some fresh air', 'Listen to music', 'Connect with friends'
    ];

    setTimeout(() => {
      const selectedRisks = risks.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
      const selectedRecs = recs.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));

      setPrediction({
        timestamp: new Date(),
        predictedMood: moods[Math.floor(Math.random() * moods.length)],
        confidence: 60 + Math.floor(Math.random() * 35),
        trend: trends[Math.floor(Math.random() * trends.length)],
        riskFactors: selectedRisks,
        recommendations: selectedRecs
      });
    }, 500);
  };

  useEffect(() => {
    fetchTrendData();
    
    // Update predictions every 15 minutes
    const interval = setInterval(fetchTrendData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declining': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <CardTitle>Mood Trend & Predictions</CardTitle>
          </div>
          <Badge className={getTrendColor(prediction.trend)} variant="secondary">
            <div className="flex items-center gap-1">
              {getTrendIcon(prediction.trend)}
              {prediction.trend}
            </div>
          </Badge>
        </div>
        <CardDescription>
          AI-powered mood forecasting for the next 2 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prediction Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">Next 2 Hours Prediction</div>
            <div className="text-2xl font-bold capitalize mb-1">{prediction.predictedMood}</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Confidence:</span>
              <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}%
              </span>
              <Progress value={prediction.confidence} className="w-20 h-2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Timeline Preview</div>
            <div className="flex gap-1">
              {trendData.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                  <div className={`h-2 rounded mt-1 ${
                    item.intensity >= 7 ? 'bg-green-400' :
                    item.intensity >= 5 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <div className="text-xs mt-1 capitalize">{item.mood}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Upcoming Risk Factors</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction.riskFactors.map((factor, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/20">
                {factor}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="text-sm font-medium mb-2">Recommended Actions</div>
          <div className="space-y-1">
            {prediction.recommendations.map((rec, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {rec}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {prediction.timestamp.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}