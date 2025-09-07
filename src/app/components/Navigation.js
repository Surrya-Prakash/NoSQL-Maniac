'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [participant, setParticipant] = useState(null);
  const [roundProgress, setRoundProgress] = useState({ 
    round1Complete: false, 
    round2Complete: false 
  });
  const [localRoundStatus, setLocalRoundStatus] = useState({
    round1Completed: false,
    round2Completed: false
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedParticipant = localStorage.getItem('participant');
    if (storedParticipant) {
      setParticipant(JSON.parse(storedParticipant));
      fetchRoundProgress(JSON.parse(storedParticipant)._id);
    }
    
    // Check local completion flags
    const round1Completed = localStorage.getItem('round1_completed') === 'true';
    const round2Completed = localStorage.getItem('round2_completed') === 'true';
    
    setLocalRoundStatus({
      round1Completed,
      round2Completed
    });
  }, []);

  // Listen for localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'round1_completed' || e.key === 'round2_completed') {
        const round1Completed = localStorage.getItem('round1_completed') === 'true';
        const round2Completed = localStorage.getItem('round2_completed') === 'true';
        
        setLocalRoundStatus({
          round1Completed,
          round2Completed
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchRoundProgress = async (participantId) => {
    try {
      const response = await fetch(`/api/participant-progress?participantId=${participantId}`);
      const data = await response.json();
      setRoundProgress(data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('participant');
    localStorage.removeItem('round1_progress');
    localStorage.removeItem('round2_progress');
    localStorage.removeItem('round1_completed');
    localStorage.removeItem('round2_completed');
    router.push('/login');
  };

  const isInActiveRound = pathname.includes('/round1') || pathname.includes('/round2');
  
  // Updated accessibility logic - Block completed rounds
  const isRound1Accessible = !localRoundStatus.round1Completed;
  const isRound2Accessible = (roundProgress.round1Complete || localRoundStatus.round1Completed) && !localRoundStatus.round2Completed;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/competition" className="text-xl font-bold text-blue-600">
              NoSQL Maniac
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {/* Competition Hub */}
            <Link 
              href="/competition" 
              className={`${pathname === '/competition' ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'} ${isInActiveRound ? 'pointer-events-none opacity-50' : ''}`}
            >
              Competition Hub
            </Link>

            {/* Round 1 - Blocked if completed */}
            <Link 
              href={isRound1Accessible ? "/competition/round1" : "#"} 
              className={`${
                pathname.includes('/round1') ? 'text-blue-600 font-medium' : 
                isRound1Accessible ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400 cursor-not-allowed'
              } ${isInActiveRound && !pathname.includes('/round1') ? 'pointer-events-none opacity-50' : ''}`}
              onClick={(e) => {
                if (!isRound1Accessible) {
                  e.preventDefault();
                  alert('Round 1 has been completed. You cannot re-enter completed rounds.');
                }
              }}
            >
              Round 1 {localRoundStatus.round1Completed && '✓ '}
            </Link>

            {/* Round 2 - Blocked if completed or Round 1 not complete */}
            <Link 
              href={isRound2Accessible ? "/competition/round2" : "#"} 
              className={`${
                pathname.includes('/round2') ? 'text-blue-600 font-medium' : 
                isRound2Accessible ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400 cursor-not-allowed'
              } ${isInActiveRound && !pathname.includes('/round2') ? 'pointer-events-none opacity-50' : ''}`}
              onClick={(e) => {
                if (!isRound2Accessible) {
                  e.preventDefault();
                  if (localRoundStatus.round2Completed) {
                    alert('Round 2 has been completed. You cannot re-enter completed rounds.');
                  } else {
                    alert('Complete Round 1 first to unlock Round 2!');
                  }
                }
              }}
            >
              Round 2 {!isRound2Accessible && !localRoundStatus.round1Completed && '🔒'} 
              {localRoundStatus.round2Completed && '✓ '}
            </Link>

            {/* Leaderboard - Always accessible */}
            <Link 
              href="/leaderboard" 
              className={`${pathname === '/leaderboard' ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
            >
              Leaderboard
            </Link>

            {/* Participant Info */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {participant?.name || 'Participant'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

