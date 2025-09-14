'use client';

import { useState } from 'react';
import { useWellnessData } from '@/hooks/useWellnessData';

export default function TestWellnessPage() {
  const { wellnessData, loading, error, refresh, getStressMetrics } = useWellnessData();
  const [rawApiTest, setRawApiTest] = useState<unknown>(null);

  const testRawAPI = async () => {
    try {
      const response = await fetch('/api/wellness');
      const data = await response.json();
      setRawApiTest(data);
    } catch (err) {
      setRawApiTest({ error: String(err) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">intervals.icu Wellness Data Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Hook Test */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Hook Test (useWellnessData)</h2>

            <button
              onClick={refresh}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                Error: {error}
              </div>
            )}

            {wellnessData && (
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Key Metrics:</h3>
                <div>HRV: {wellnessData.hrv || 'N/A'} ms</div>
                <div>Resting HR: {wellnessData.restingHR || 'N/A'} BPM</div>
                <div>Sleep Score: {wellnessData.sleepScore || 'N/A'}/100</div>
                <div>Sleep Quality: {wellnessData.sleepQuality || 'N/A'}/5</div>
                <div>Stress: {wellnessData.stress || 'N/A'}/5</div>
                <div>Mood: {wellnessData.mood || 'N/A'}/5</div>
                <div>Readiness: {wellnessData.readiness || 'N/A'}/100</div>
              </div>
            )}

            <h3 className="font-semibold mt-4 mb-2">Stress Metrics (for LLM):</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(getStressMetrics(), null, 2)}
            </pre>
          </div>

          {/* Raw API Test */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Raw API Test</h2>

            <button
              onClick={testRawAPI}
              className="bg-green-500 text-white px-4 py-2 rounded mb-4"
            >
              Test /api/wellness
            </button>

            {rawApiTest !== null && (
              <div>
                <h3 className="font-semibold mb-2">Raw API Response:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(rawApiTest, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>

        {/* Full Data Debug */}
        {wellnessData && (
          <div className="bg-white rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Full Wellness Data (Debug)</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(wellnessData, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}