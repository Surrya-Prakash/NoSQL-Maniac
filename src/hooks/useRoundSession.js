'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useRoundSession(roundNumber, duration = 90) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [violations, setViolations] = useState([]);
  const intervalRef = useRef(null);
  const sessionStartRef = useRef(null);

  const sessionKey = `round${roundNumber}_session`;
  const violationsKey = `round${roundNumber}_violations`;

  // Initialize or restore session
  useEffect(() => {
    const savedSession = localStorage.getItem(sessionKey);
    const savedViolations = localStorage.getItem(violationsKey);
    
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      const remaining = Math.max(0, session.totalDuration - elapsed);
      
      setTimeRemaining(remaining);
      setSessionData(session);
      
      if (remaining > 0) {
        setIsActive(true);
      }
    }
    
    if (savedViolations) {
      setViolations(JSON.parse(savedViolations));
    }
  }, [sessionKey, violationsKey]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Update session in localStorage
          if (sessionData) {
            const updatedSession = {
              ...sessionData,
              timeRemaining: newTime,
              lastUpdate: Date.now()
            };
            localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining, sessionData, sessionKey]);

  const startSession = useCallback((participantId) => {
    const startTime = Date.now();
    const session = {
      roundNumber,
      participantId,
      startTime,
      totalDuration: duration * 60,
      timeRemaining: duration * 60,
      lastUpdate: startTime
    };
    
    setSessionData(session);
    setTimeRemaining(duration * 60);
    setIsActive(true);
    sessionStartRef.current = startTime;
    
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }, [roundNumber, duration, sessionKey]);

  const endSession = useCallback(() => {
    setIsActive(false);
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(violationsKey);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [sessionKey, violationsKey]);

  const addViolation = useCallback((type, description) => {
    const violation = {
      type,
      description,
      timestamp: Date.now(),
      timeInRound: sessionData ? Math.floor((Date.now() - sessionData.startTime) / 1000) : 0
    };
    
    const newViolations = [...violations, violation];
    setViolations(newViolations);
    localStorage.setItem(violationsKey, JSON.stringify(newViolations));
    
    // Log to backend
    if (sessionData) {
      fetch('/api/log-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: sessionData.participantId,
          roundNumber,
          violation
        })
      }).catch(console.error);
    }
  }, [violations, sessionData, roundNumber, violationsKey]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    isActive,
    sessionData,
    violations,
    startSession,
    endSession,
    addViolation,
    formatTime: () => formatTime(timeRemaining),
    isTimeUp: timeRemaining <= 0
  };
}
