'use client';

import { useEffect, useState } from 'react';

interface StressGradientBackgroundProps {
  stressLevel: number; // 0-6 scale
  children: React.ReactNode;
}

export default function StressGradientBackground({ stressLevel, children }: StressGradientBackgroundProps) {
  const [gradientKey, setGradientKey] = useState(0);

  // Generate random wave-like gradient based on stress level
  const generateGradient = (stress: number): string => {
    // Normalize stress (0-6) to intensity (0-1)
    const intensity = Math.min(stress / 6, 1);

    // Base blue values - more intense blues as stress increases
    const lightBlue = intensity < 0.3 ? '#e0f2fe' : intensity < 0.6 ? '#b3e5fc' : '#81d4fa';
    const mediumBlue = intensity < 0.3 ? '#b3e5fc' : intensity < 0.6 ? '#4fc3f7' : '#29b6f6';
    const darkBlue = intensity < 0.3 ? '#81d4fa' : intensity < 0.6 ? '#0277bd' : '#01579b';

    // Random gradient angles and positions for wave effect
    const angle1 = Math.floor(Math.random() * 360);
    const angle2 = Math.floor(Math.random() * 360);
    const angle3 = Math.floor(Math.random() * 360);

    // Random gradient positions (0-100%)
    const pos1 = Math.floor(Math.random() * 30);
    const pos2 = 30 + Math.floor(Math.random() * 40);
    const pos3 = 70 + Math.floor(Math.random() * 30);

    // Create multiple overlapping gradients for wave effect
    return `
      linear-gradient(${angle1}deg, ${lightBlue}40 ${pos1}%, transparent ${pos2}%),
      linear-gradient(${angle2}deg, ${mediumBlue}30 ${pos2}%, transparent ${pos3}%),
      linear-gradient(${angle3}deg, ${darkBlue}20 ${pos3}%, transparent 100%),
      linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)
    `;
  };

  // Regenerate gradient when stress level changes
  useEffect(() => {
    setGradientKey(prev => prev + 1);
  }, [stressLevel]);

  const backgroundStyle = {
    background: generateGradient(stressLevel),
    backgroundSize: '400% 400%, 300% 300%, 500% 500%, 100% 100%',
    animation: `waveMovement 15s ease-in-out infinite,
                intensityPulse ${Math.max(8 - stressLevel, 3)}s ease-in-out infinite alternate`,
  };

  return (
    <div
      className="min-h-screen transition-all duration-1000 ease-in-out"
      style={backgroundStyle}
      key={gradientKey}
    >
      {/* Wave animation styles */}
      <style jsx>{`
        @keyframes waveMovement {
          0%, 100% {
            background-position: 0% 50%, 100% 50%, 50% 0%, 0% 0%;
          }
          25% {
            background-position: 100% 0%, 0% 100%, 0% 50%, 0% 0%;
          }
          50% {
            background-position: 50% 100%, 50% 0%, 100% 100%, 0% 0%;
          }
          75% {
            background-position: 0% 0%, 100% 100%, 50% 50%, 0% 0%;
          }
        }

        @keyframes intensityPulse {
          0% {
            filter: brightness(1) saturate(1);
          }
          100% {
            filter: brightness(${1 + stressLevel * 0.05}) saturate(${1 + stressLevel * 0.1});
          }
        }
      `}</style>

      {children}
    </div>
  );
}