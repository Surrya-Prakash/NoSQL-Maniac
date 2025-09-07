'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

export function useProctoring(addViolation, isActive, autoSubmitCallback) {
  const [violationCount, setViolationCount] = useState(0);
  const tabSwitchCount = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const warningShown = useRef(false);
  const hasBeenEjected = useRef(false);

  // Enhanced violation handler
  const handleViolation = useCallback((type, description) => {
    if (hasBeenEjected.current) return; // Stop logging after ejection
    
    setViolationCount(prevCount => {
      const newCount = prevCount + 1;
      
      // Show warning at 5 violations
      if (newCount === 5 && !warningShown.current) {
        warningShown.current = true;
        const warningMessage = `⚠️ FINAL WARNING ⚠️

You have committed 5 violations during this proctored test.

CONSEQUENCES OF ANOTHER VIOLATION:
• Your test will be automatically submitted
• You will be ejected from the competition  
• No further answers can be submitted
• This action cannot be undone

Current violations: ${newCount}

Click OK to acknowledge this warning and continue.`;
        
        alert(warningMessage);
      }
      
      // Auto-eject after 5 violations
      if (newCount > 5) {
        hasBeenEjected.current = true;
        
        const ejectionMessage = `🚫 TEST EJECTION NOTICE 🚫

You have been ejected from the test due to excessive violations.

FINAL ACTIONS:
• Your current progress has been automatically submitted
• You cannot re-enter this round
• Your responses are final
• Please contact administrators if needed

Total violations: ${newCount}`;
        
        alert(ejectionMessage);
        
        // Call auto-submit callback
        if (autoSubmitCallback) {
          autoSubmitCallback();
        }
        
        return prevCount; // Don't increment after ejection
      }
      
      return newCount;
    });
    
    // Add violation to logs
    addViolation(type, description);
  }, [addViolation, autoSubmitCallback]);

  // Tab/Window focus monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        handleViolation('TAB_SWITCH', `Switched away from test tab (${tabSwitchCount.current} times)`);
      } else {
        lastActiveTime.current = Date.now();
      }
    };

    const handleBlur = () => {
      handleViolation('WINDOW_BLUR', 'Window lost focus');
    };

    const handleFocus = () => {
      const awayTime = Math.floor((Date.now() - lastActiveTime.current) / 1000);
      if (awayTime > 5) {
        handleViolation('LONG_ABSENCE', `Returned after ${awayTime} seconds away`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isActive, handleViolation]);

  // Keyboard shortcuts blocking
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      const blockedCombinations = [
        { key: 'F12' },
        { key: 'F5' },
        { ctrl: true, key: 'r' },
        { ctrl: true, key: 'u' },
        { ctrl: true, key: 'i' },
        { ctrl: true, key: 'j' },
        { ctrl: true, key: 's' },
        { ctrl: true, key: 'p' },
        { ctrl: true, key: 'c' },
        { ctrl: true, key: 'v' },
        { ctrl: true, shift: true, key: 'i' },
        { ctrl: true, shift: true, key: 'c' },
        { alt: true, key: 'Tab' },
        { meta: true, key: 'Tab' },
      ];

      const isBlocked = blockedCombinations.some(combo => {
        return (!combo.ctrl || e.ctrlKey) &&
               (!combo.alt || e.altKey) &&
               (!combo.shift || e.shiftKey) &&
               (!combo.meta || e.metaKey) &&
               e.key.toLowerCase() === (combo.key?.toLowerCase() || combo.key);
      });

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation('BLOCKED_SHORTCUT', `Attempted to use blocked shortcut: ${e.key}`);
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, handleViolation]);

  // Right-click blocking
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      handleViolation('RIGHT_CLICK', 'Attempted to right-click');
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [isActive, handleViolation]);

  // Copy/paste monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleCopy = (e) => {
      handleViolation('COPY_ATTEMPT', 'Attempted to copy content');
    };

    const handlePaste = (e) => {
      handleViolation('PASTE_ATTEMPT', 'Attempted to paste content');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [isActive, handleViolation]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isActive, handleViolation]);

  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        handleViolation('FULLSCREEN_DENIED', 'Fullscreen request denied');
      });
    }
  }, [handleViolation]);

  return {
    requestFullscreen,
    violationCount,
    hasBeenEjected: hasBeenEjected.current
  };
}

