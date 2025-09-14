'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { supabase, HeartRateReading } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface HeartRateData {
  bpm: number;
  timestamp: Date;
  status: 'normal' | 'elevated' | 'high';
}

interface HeartRatePoint {
  value: number;
  timestamp: Date;
}

export default function HeartRateCard() {
  const [mounted, setMounted] = useState(false);
  const [heartRate, setHeartRate] = useState<HeartRateData>({
    bpm: 72,
    timestamp: new Date(),
    status: 'normal'
  });
  const [heartRateHistory, setHeartRateHistory] = useState<HeartRatePoint[]>([]);
  const [,] = useState(false); // isConnected removed as it's unused

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Fetch the latest heart rate reading on component mount
    const fetchLatestHeartRate = async () => {
      console.log('🔍 Fetching latest heart rate data...');
      const { data, error } = await supabase
        .from('physio_measurements')
        .select('*')
        .eq('metric', 'heart_rate')
        .order('ts', { ascending: false })
        .limit(1); // Just get the latest reading for current display

      if (error) {
        console.error('❌ Error fetching current heart rate:', error);
        return;
      }

      console.log('💓 Current HR data:', data);

      if (data && data.length > 0) {
        // Set current heart rate (most recent)
        const latestReading = data[0] as HeartRateReading;
        console.log('💓 Setting current heart rate:', Math.round(latestReading.value), 'BPM');
        setHeartRate({
          bpm: Math.round(latestReading.value),
          timestamp: new Date(latestReading.ts),
          status: getBpmStatus(Math.round(latestReading.value))
        });
      } else {
        console.log('⚠️ No current heart rate data found');
      }
    };

    fetchLatestHeartRate();

    // Separate function to fetch historical data for graph
    const fetchHeartRateHistory = async () => {
      console.log('📈 Fetching heart rate history for graph...');
      const { data, error } = await supabase
        .from('physio_measurements')
        .select('value, ts')
        .eq('metric', 'heart_rate')
        .order('ts', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error fetching heart rate history:', error);
        return;
      }

      console.log('📈 Graph data fetched:', data);
      console.log('📈 Graph data length:', data?.length);

      if (data && data.length > 0) {
        // Reverse to get chronological order for graph
        const history = data.reverse().map((reading: { value: number; ts: string }) => ({
          value: Math.round(reading.value),
          timestamp: new Date(reading.ts)
        }));
        console.log('📈 Setting graph history:', history);
        setHeartRateHistory(history);
      }
    };

    // Fetch graph data immediately
    fetchHeartRateHistory();

    // Set up interval to fetch graph data every 5 seconds
    const graphInterval = setInterval(fetchHeartRateHistory, 5000);

    // Set up real-time subscription for heart rate changes
    const channel = supabase
      .channel('heart-rate-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'physio_measurements',
          filter: 'metric=eq.heart_rate'
        },
        (payload: RealtimePostgresChangesPayload<HeartRateReading>) => {
          console.log('🔥 Real-time update received:', payload);
          if (payload.new) {
            const reading = payload.new as HeartRateReading;
            console.log('💓 Real-time heart rate update:', Math.round(reading.value), 'BPM');

            // Update current heart rate
            setHeartRate({
              bpm: Math.round(reading.value),
              timestamp: new Date(reading.ts),
              status: getBpmStatus(Math.round(reading.value))
            });

            // Update history for graph (keep last 5 points)
            setHeartRateHistory(prev => {
              const newPoint = {
                value: Math.round(reading.value),
                timestamp: new Date(reading.ts)
              };
              const updated = [...prev, newPoint];
              return updated.slice(-5); // Keep only last 5 points
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🌐 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to Supabase real-time heart rate updates');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('❌ Disconnected from Supabase real-time updates:', status);
        }
      });

    // Poll for updates every 2 seconds to get latest data
    const pollInterval = setInterval(async () => {
      console.log('🔄 Polling for latest heart rate data...');
      await fetchLatestHeartRate();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      clearInterval(graphInterval);
    };
  }, [mounted]);

  const getBpmStatus = (bpm: number): 'normal' | 'elevated' | 'high' => {
    if (bpm < 80) return 'normal';
    if (bpm < 100) return 'elevated';
    return 'high';
  };

  // Removed unused getStatusColor and getHeartColor functions

  // Simple Line Graph Component
  const LineGraph = ({ data }: { data: HeartRatePoint[] }) => {
    console.log('🎯 LineGraph received data:', data, 'length:', data.length);

    if (data.length < 1) {
      return (
        <div className="w-full h-20 flex items-center justify-center text-gray-400">
          <span>No data available</span>
        </div>
      );
    }

    if (data.length === 1) {
      return (
        <div className="w-full h-20 flex items-center justify-center text-gray-400">
          <span>Need more data points for trend ({data.length}/2)</span>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    // Force a minimum range to make changes visible, even if data is very similar
    let range = maxValue - minValue;
    if (range < 10) range = 10; // Minimum range of 10 BPM for visibility

    const centerValue = (maxValue + minValue) / 2;
    const adjustedMin = centerValue - range / 2;
    // const adjustedMax = centerValue + range / 2; // Unused variable commented out

    const width = 300;
    const height = 80;
    const padding = 10;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - adjustedMin) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full h-24 flex items-center justify-center">
        <svg width={width} height={height} className="border border-gray-200 rounded">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Main line */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            points={points}
            className="drop-shadow-sm"
          />

        </svg>
      </div>
    );
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <CardTitle>Heart Rate</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900">
              {heartRate.bpm}
            </div>
          </div>

          <div className="w-full">
            <LineGraph data={heartRateHistory} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}