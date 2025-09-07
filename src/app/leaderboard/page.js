'use client';
import { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const storedParticipant = localStorage.getItem('participant');
    if (storedParticipant) {
      setParticipant(JSON.parse(storedParticipant));
    }
    fetchLeaderboard();
  }, [refresh]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      } else {
        console.error('Leaderboard fetch failed:', data.error);
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLeaderboard([]);
    }
    setLoading(false);
  };

  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-500 bg-white';
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const isCurrentParticipant = (entry) => {
    return participant && entry._id === participant._id;
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
                <p className="text-blue-100 mt-2">Real-time competition rankings</p>
              </div>
              <div className="text-right text-white">
                <div className="text-sm opacity-75">Total Participants</div>
                <div className="text-2xl font-bold">{leaderboard.length}</div>
                <button
                  onClick={handleRefresh}
                  className="mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard Content */}
          <div className="p-6">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No submissions yet</h3>
                <p className="text-gray-500">Be the first to complete a question and appear on the leaderboard!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {/* Second Place */}
                    <div className="md:order-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">🥈</div>
                      <h3 className="font-bold text-lg text-gray-800">{leaderboard[1]?.participantName}</h3>
                      <div className="text-2xl font-bold text-gray-600 mt-2">{leaderboard[1]?.totalScore}</div>
                      <div className="text-sm text-gray-500">{leaderboard[1]?.questionsAnswered} questions</div>
                    </div>

                    {/* First Place */}
                    <div className="md:order-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-6 text-center transform md:scale-110">
                      <div className="text-5xl mb-2">🥇</div>
                      <h3 className="font-bold text-xl text-yellow-800">{leaderboard[0]?.participantName}</h3>
                      <div className="text-3xl font-bold text-yellow-600 mt-2">{leaderboard[0]?.totalScore}</div>
                      <div className="text-sm text-yellow-700">{leaderboard[0]?.questionsAnswered} questions</div>
                      <div className="mt-2 bg-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                        👑 Leader
                      </div>
                    </div>

                    {/* Third Place */}
                    <div className="md:order-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">🥉</div>
                      <h3 className="font-bold text-lg text-orange-800">{leaderboard[2]?.participantName}</h3>
                      <div className="text-2xl font-bold text-orange-600 mt-2">{leaderboard[2]?.totalScore}</div>
                      <div className="text-sm text-orange-500">{leaderboard[2]?.questionsAnswered} questions</div>
                    </div>
                  </div>
                )}

                {/* Full Rankings Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Complete Rankings</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Submit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboard.map((entry, index) => (
                          <tr 
                            key={entry._id}
                            className={`
                              ${isCurrentParticipant(entry) ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                              ${index < 3 ? getRankColor(index + 1) : ''}
                            `}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg font-bold">
                                  {getRankIcon(entry.rank)}
                                </span>
                                {isCurrentParticipant(entry) && (
                                  <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.participantName || 'Anonymous'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                {entry.totalScore || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.questionsAnswered || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatTime(entry.averageTime)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {entry.lastSubmission ? new Date(entry.lastSubmission).toLocaleTimeString() : 'N/A'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {participant && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Your Rank</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.find(entry => isCurrentParticipant(entry))?.rank || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🎯</div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Your Score</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.find(entry => isCurrentParticipant(entry))?.totalScore || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">✅</div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Questions Solved</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {leaderboard.find(entry => isCurrentParticipant(entry))?.questionsAnswered || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

