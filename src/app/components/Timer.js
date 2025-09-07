'use client';
import { useState, useEffect } from 'react';

export default function Timer({ duration, onTimeUp, isActive = true }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= 300; // Last 5 minutes
  const isCritical = timeLeft <= 60; // Last minute

  return (
    <div className={`
      fixed top-4 right-4 p-4 rounded-lg font-mono text-xl font-bold
      ${isCritical ? 'bg-red-600 text-white animate-pulse' : 
        isWarning ? 'bg-orange-500 text-white' : 
        'bg-blue-600 text-white'}
      shadow-lg z-50
    `}>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>{formatTime(timeLeft)}</span>
      </div>
      {isWarning && (
        <div className="text-sm mt-1">
          {isCritical ? 'TIME UP SOON!' : 'Hurry up!'}
        </div>
      )}
    </div>
  );
}
