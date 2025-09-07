'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

export default function CompetitionPage() {
  const [participant, setParticipant] = useState(null);
  const [roundProgress, setRoundProgress] = useState({
    round1Complete: false,
    round2Complete: false,
    round1Questions: 0,
    round2Questions: 0,
    totalScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRound2Accessible, setIsRound2Accessible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedParticipant = localStorage.getItem('participant');
    if (!storedParticipant) {
      router.push('/login');
      return;
    }
    
    const participantData = JSON.parse(storedParticipant);
    setParticipant(participantData);
    fetchProgress(participantData._id);
  }, [router]);

  const fetchProgress = async (participantId) => {
    try {
      const response = await fetch(`/api/participant-progress?participantId=${participantId}`);
      const data = await response.json();
      
      // Check local completion flags safely
      const round1LocalComplete = localStorage.getItem('round1_completed') === 'true';
      const round2LocalComplete = localStorage.getItem('round2_completed') === 'true';
      
      // Combine server data with local flags
      const combinedProgress = {
        ...data,
        round1Complete: data.round1Complete || round1LocalComplete,
        round2Complete: data.round2Complete || round2LocalComplete
      };
      
      setRoundProgress(combinedProgress);
      
      // Set Round 2 accessibility
      setIsRound2Accessible(combinedProgress.round1Complete);
      
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
    setLoading(false);
  };

  const handleRoundEntry = (roundNumber) => {
    // Check if round is completed
    const roundCompleted = localStorage.getItem(`round${roundNumber}_completed`) === 'true';
    
    if (roundCompleted) {
      alert(`Round ${roundNumber} has already been completed. You cannot re-enter completed rounds.`);
      return;
    }

    if (roundNumber === 2 && !isRound2Accessible) {
      alert('Complete Round 1 first to unlock Round 2!');
      return;
    }
    
    // Check if there's existing progress
    const progressKey = `round${roundNumber}_progress`;
    const existingProgress = localStorage.getItem(progressKey);
    
    if (existingProgress) {
      const confirmResume = confirm(
        `You have an ongoing Round ${roundNumber} session. Do you want to resume where you left off?`
      );
      if (!confirmResume) {
        const confirmRestart = confirm(
          `Are you sure you want to restart Round ${roundNumber}? Your current progress will be lost.`
        );
        if (confirmRestart) {
          localStorage.removeItem(progressKey);
        } else {
          return;
        }
      }
    }
    
    router.push(`/competition/round${roundNumber}`);
  };

  const getRoundStatus = (round) => {
    if (round === 1) {
      return roundProgress.round1Complete ? 'Completed' : 
             roundProgress.round1Questions > 0 ? `In Progress (${roundProgress.round1Questions}/20)` : 'Not Started';
    } else {
      if (!isRound2Accessible) return 'Locked';
      return roundProgress.round2Complete ? 'Completed' : 
             roundProgress.round2Questions > 0 ? `In Progress (${roundProgress.round2Questions}/8)` : 'Not Started';
    }
  };

  const getRoundStatusColor = (round) => {
    const status = getRoundStatus(round);
    if (status === 'Completed') return 'text-green-600 bg-green-100';
    if (status === 'Locked') return 'text-gray-400 bg-gray-100';
    if (status.includes('In Progress')) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const calculateProgress = (round) => {
    if (round === 1) {
      return Math.min((roundProgress.round1Questions / 20) * 100, 100);
    } else {
      if (!isRound2Accessible) return 0;
      return Math.min((roundProgress.round2Questions / 8) * 100, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section with Darker Text */}
{/* Hero Section with Darker Text - Replace this section only */}
<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="text-center">
      <h1 className="text-4xl font-extrabold mb-4 text-white">🏆 NoSQL Maniac</h1>
      <p className="text-xl text-white font-semibold mb-6">
        Master MongoDB queries and climb the leaderboard!
      </p>
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-2xl font-extrabold mb-3 text-gray-800">Welcome, {participant?.name}!</div>
        <div className="text-gray-700 font-bold text-lg">
          <div className="mb-1">Total Score: <span className="font-black text-xl text-gray-800">{roundProgress.totalScore}</span></div>
          <div>Questions Solved: <span className="font-black text-xl text-gray-800">{roundProgress.round1Questions + roundProgress.round2Questions}</span></div>
        </div>
      </div>
    </div>
  </div>
</div>


      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Round Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          
          {/* Round 1 Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Round 1</h3>
                  <p className="text-blue-100">Find Operations & Filtering</p>
                </div>
                <div className="text-4xl opacity-75">🔍</div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoundStatusColor(1)}`}>
                    {getRoundStatus(1)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{roundProgress.round1Questions}/20 questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(1)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-bold text-gray-800">20</div>
                    <div className="text-gray-600">Questions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-bold text-gray-800">90</div>
                    <div className="text-gray-600">Minutes</div>
                  </div>
                </div>

{/* Round 1 Button */}
<button
  onClick={() => handleRoundEntry(1)}
  disabled={localStorage.getItem('round1_completed') === 'true'}
  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
    localStorage.getItem('round1_completed') === 'true'
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  }`}
>
  {localStorage.getItem('round1_completed') === 'true' ? '✓ Round 1 Completed' : 
   roundProgress.round1Questions > 0 ? '▶️ Continue Round 1' : '🚀 Start Round 1'}
</button>
              </div>
            </div>
          </div>

          {/* Round 2 Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`bg-gradient-to-r p-6 text-white ${
              !roundProgress.round1Complete 
                ? 'from-gray-400 to-gray-500' 
                : 'from-purple-500 to-purple-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    Round 2 {!roundProgress.round1Complete && '🔒'}
                  </h3>
                  <p className={!roundProgress.round1Complete ? 'text-gray-200' : 'text-purple-100'}>
                    Aggregation Pipelines
                  </p>
                </div>
                <div className="text-4xl opacity-75">⚡</div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoundStatusColor(2)}`}>
                    {getRoundStatus(2)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{roundProgress.round2Questions}/8 questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        !roundProgress.round1Complete ? 'bg-gray-400' : 'bg-purple-600'
                      }`}
                      style={{ width: `${calculateProgress(2)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-bold text-gray-800">8</div>
                    <div className="text-gray-600">Questions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-bold text-gray-800">90</div>
                    <div className="text-gray-600">Minutes</div>
                  </div>
                </div>

               {/* Round 2 Button */}
<button
  onClick={() => handleRoundEntry(2)}
  disabled={!isRound2Accessible || localStorage.getItem('round2_completed') === 'true'}
  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
    !isRound2Accessible || localStorage.getItem('round2_completed') === 'true'
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : roundProgress.round2Complete
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-purple-600 text-white hover:bg-purple-700'
  }`}
>
  {localStorage.getItem('round2_completed') === 'true' ? '✓ Competition Completed' :
   !isRound2Accessible ? '🔒 Complete Round 1 First' :
   roundProgress.round2Questions > 0 ? '▶️ Continue Round 2' : '🚀 Start Round 2'}
</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/leaderboard" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Leaderboard</h4>
                <p className="text-gray-600 text-sm">Check your ranking</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Your Score</h4>
                <p className="text-2xl font-bold text-blue-600">{roundProgress.totalScore}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3 mr-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Completed</h4>
                <p className="text-2xl font-bold text-green-600">
                  {roundProgress.round1Questions + roundProgress.round2Questions}/28
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Overview - Moved to Bottom */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Competition Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700">📋 Rules & Format</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Two rounds: Find Queries + Aggregation Pipelines</li>
                <li>• 90 minutes per round</li>
                <li>• Points based on correctness and query performance</li>
                <li>• Complete Round 1 to unlock Round 2</li>
                <li>• Once you enter a round, you cannot navigate away</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700">🎯 Scoring System</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Round 1: 15 points per question (20 questions)</li>
                <li>• Round 2: 20 points per question (8 questions)</li>
                <li>• 70% correctness + 30% performance</li>
                <li>• Partial points for partial matches</li>
                <li>• Faster queries earn higher performance scores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


