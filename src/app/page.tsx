'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import HeartRateCard from '@/components/HeartRateCard';
import StressGradientBackground from '@/components/StressGradientBackground';
import { useStressScore } from '@/hooks/useStressScore';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { stressScore } = useStressScore();

  return (
    <StressGradientBackground stressLevel={stressScore}>
      <div className="min-h-screen p-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-8 items-center">
            {/* Heart Rate */}
            <HeartRateCard />

            {/* Stress Score */}
            <StressScoreDisplay />
          </div>
        </div>

        {/* Wellness Assistant at bottom */}
        <div className="max-w-2xl mx-auto w-full">
          <WellnessAssistant />
        </div>
      </div>
    </StressGradientBackground>
  );
}


// Stress Score Display - Now using real AI-powered stress analysis
function StressScoreDisplay() {
  const [mounted, setMounted] = useState(false);
  const { stressScore } = useStressScore();

  // Stress level emojis (0 = lowest stress, 6 = highest stress)
  const stressEmojis = useMemo(() => [
    { emoji: '😊', label: 'Relaxed' },      // 0 - Very low stress
    { emoji: '🙂', label: 'Calm' },        // 1 - Low stress
    { emoji: '😐', label: 'Neutral' },     // 2 - Slightly tense
    { emoji: '😑', label: 'Tense' },       // 3 - Moderate stress (default)
    { emoji: '🫣', label: 'Overwhelmed' },  // 3.5 - Face with peeking eye
    { emoji: '😬', label: 'Stressed' },    // 4 - High stress
    { emoji: '😰', label: 'Very Stressed' }, // 5 - Very high stress
    { emoji: '🤯', label: 'Mindblown' }     // 6 - Overwhelmed/mindblown
  ], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStressColor = (score: number) => {
    if (score <= 1) return 'text-green-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const currentStress = stressEmojis[Math.min(stressScore, 6)];

  if (!mounted) return <div className="bg-white rounded-lg p-8 text-center">Loading...</div>;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg">
      <div className="text-8xl mb-4">{currentStress.emoji}</div>
      <div className="text-lg text-gray-600">Stress Level</div>
      <div className={`text-sm font-medium mt-1 ${getStressColor(stressScore)}`}>
        {currentStress.label}
      </div>
    </div>
  );
}

// Cohere-Powered Wellness Assistant
function WellnessAssistant() {
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState(72);
  const [suggestionQueue, setSuggestionQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to fetch Gmail events from Supabase
  const fetchGmailEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('event_id, ts_range, start_at, end_at, details, ingested_at')
        .order('ingested_at', { ascending: false })
        .limit(5);

      console.log('📧 Fetched Gmail events:', data);
      return data || [];
    } catch (err) {
      console.error('Error fetching Gmail events:', err);
      return [];
    }
  };

  // Function to get current heart rate and detect changes
  const fetchCurrentHeartRate = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('physio_measurements')
        .select('value')
        .eq('metric', 'heart_rate')
        .order('ts', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const newHR = Math.round(data[0].value);
        const previousHR = currentHeartRate;
        setCurrentHeartRate(newHR);

        // Check for significant heart rate changes
        const hrChange = newHR - previousHR;
        if (Math.abs(hrChange) >= 8) { // 8+ BPM change
          const spikeMessage = hrChange > 0
            ? generateSpikeMessage(hrChange)
            : generateDipMessage(Math.abs(hrChange));

          // Insert spike/dip message at front of queue
          setSuggestionQueue(prev => [spikeMessage, ...prev]);
          setQueueIndex(0);
        }

        return newHR;
      }
      return 72;
    } catch (error) {
      console.error('Error fetching heart rate:', error);
      return 72;
    }
  }, [currentHeartRate]);

  // Generate playful spike messages
  const generateSpikeMessage = (increase: number): string => {
    const messages = [
      `Whoa, +${increase} BPM! Someone's excited 👀`,
      `Heart rate spike detected! You scared? 😅`,
      `+${increase} BPM jump - something got you pumped!`,
      `Sudden energy boost detected! ⚡`,
      `Heart's racing - good news or coffee? ☕`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Generate playful dip messages
  const generateDipMessage = (decrease: number): string => {
    const messages = [
      `Suddenly so calm... -${decrease} BPM drop 😌`,
      `Zen mode activated! Heart rate chilling`,
      `Deep breath effect? -${decrease} BPM instantly`,
      `Someone's found their chill 🧘‍♀️`,
      `Stress just left the building! Nice drop`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Generate suggestions using Cohere
  const generateSuggestions = useCallback(async () => {
    try {
      const heartRate = await fetchCurrentHeartRate();
      const events = await fetchGmailEvents();

      const now = new Date();
      const timeOfDay = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heartRate,
          timeOfDay,
          timezone,
          events,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const result = await response.json();

      // Parse the numbered list from Cohere response
      const suggestions = result.suggestion
        .split('\n')
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 0);

      console.log('🤖 Generated suggestions:', suggestions);
      setSuggestionQueue(suggestions);
      setQueueIndex(0);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestionQueue(['Having trouble connecting... but hey, breathe! 🌬️']);
      setQueueIndex(0);
    }
  }, [fetchCurrentHeartRate]);

  // Rotate through suggestion queue every 8 seconds
  useEffect(() => {
    if (!mounted || suggestionQueue.length === 0) return;

    const rotateInterval = setInterval(() => {
      setQueueIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % suggestionQueue.length;
        // If we've completed the full cycle, generate new suggestions
        if (nextIndex === 0 && prevIndex === suggestionQueue.length - 1) {
          setTimeout(generateSuggestions, 1000); // Regenerate after 1s delay
        }
        return nextIndex;
      });
    }, 8000); // 8 seconds per suggestion

    return () => clearInterval(rotateInterval);
  }, [mounted, suggestionQueue, generateSuggestions]);

  // Update current suggestion when queue or index changes
  useEffect(() => {
    if (suggestionQueue.length > 0) {
      setCurrentSuggestion(suggestionQueue[queueIndex]);
    }
  }, [suggestionQueue, queueIndex]);

  // Monitor heart rate changes every 10 seconds
  useEffect(() => {
    if (!mounted) return;

    fetchCurrentHeartRate();
    const hrInterval = setInterval(fetchCurrentHeartRate, 10000);
    return () => clearInterval(hrInterval);
  }, [mounted, fetchCurrentHeartRate]);

  // Initial suggestion generation
  useEffect(() => {
    if (!mounted) return;
    generateSuggestions();
  }, [mounted, generateSuggestions]);

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-lg p-4 mb-4 min-h-[100px] shadow-lg">
      <div className="text-gray-700 leading-relaxed text-lg">
        {currentSuggestion || "Getting to know you..."}
      </div>
    </div>
  );
}
