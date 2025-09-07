'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/app/components/QuestionCard';
import QueryEditor from '@/app/components/QueryEditor';
import ResultDisplay from '@/app/components/ResultDisplay';
import Navigation from '@/app/components/Navigation';
import { useConfirm } from '@/hooks/useConfirm';
import { useRoundSession } from '@/hooks/useRoundSession';
import { useProctoring } from '@/hooks/useProctoring';
import RoundEntryModal from '@/app/components/RoundEntryModal';

export default function Round2Page() {
  const [participant, setParticipant] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [showEntryModal, setShowEntryModal] = useState(true);
  const [round1Complete, setRound1Complete] = useState(false);
  const router = useRouter();
  const confirm = useConfirm();

  // Session hooks for Round 2
  const {
    timeRemaining,
    isActive: timerActive,
    sessionData,
    violations,
    startSession,
    endSession,
    addViolation,
    formatTime,
    isTimeUp
  } = useRoundSession(2, 90);

  // Auto-eject callback function for Round 2
  const handleAutoEject = useCallback(async () => {
    // Set completion flag
    localStorage.setItem('round2_completed', 'true');
    
    // Log ejection
    addViolation('AUTO_EJECT', 'Participant ejected due to excessive violations');
    endSession();
    
    // Clear progress
    localStorage.removeItem('round2_progress');
    
    // Navigate to leaderboard
    router.replace('/leaderboard');
  }, [addViolation, endSession, router]);

  // Proctoring hook with auto-eject callback
  const { requestFullscreen, violationCount, hasBeenEjected } = useProctoring(
    addViolation, 
    timerActive, 
    handleAutoEject
  );

  useEffect(() => {
    const checkRound1Status = async () => {
      const storedParticipant = localStorage.getItem('participant');
      if (!storedParticipant) {
        router.push('/login');
        return;
      }

      const participant = JSON.parse(storedParticipant);
      const round1LocalComplete = localStorage.getItem('round1_completed') === 'true';
      
      try {
        const response = await fetch(`/api/participant-progress?participantId=${participant._id}`);
        const progress = await response.json();
        
        // Allow access if either server says complete OR local flag is set
        if (!progress.round1Complete && !round1LocalComplete) {
          alert('You must complete Round 1 before accessing Round 2!');
          router.push('/competition');
          return;
        }
        
        setRound1Complete(true);
        setParticipant(participant);
        fetchQuestions();
        
        // Restore progress
        const savedProgress = localStorage.getItem('round2_progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setSubmissions(progress.submissions || {});
          setTotalScore(progress.totalScore || 0);
          
          // If there's an active session, don't show entry modal
          if (sessionData) {
            setShowEntryModal(false);
          }
        }
      } catch (error) {
        console.error('Failed to check progress:', error);
        router.push('/competition');
      }
    };

    checkRound1Status();
  }, [router , sessionData]);


  useEffect(() => {
    // Clear previous result when switching questions
    setResult(null);
  }, [currentQuestion]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    addViolation('TIME_UP', 'Round 2 time expired');
    endSession();
    alert('⏰ Time is up! Round 2 has ended.');
    localStorage.removeItem('round2_progress');
    router.push('/leaderboard');
  }, [addViolation, endSession, router]);

  useEffect(() => {
    if (isTimeUp && timerActive) {
      handleTimeUp();
    }
  }, [isTimeUp, timerActive, handleTimeUp]);

  // Simplified navigation blocking
  useEffect(() => {
    if (!timerActive) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your test session is active. Leaving will be logged as a violation.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerActive]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/problems/round2');
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleRoundStart = () => {
    if (!participant) return;
    
    setShowEntryModal(false);
    startSession(participant._id);
    requestFullscreen();
    
    // Log session start
    addViolation('SESSION_START', 'Round 2 session started');
  };

  const handleCompleteRound = async () => {
    const isConfirmed = await confirm({
      title: 'Complete Round 2 & Finish Competition',
      message: `Are you sure you want to complete Round 2 and finish the entire competition?

⚠️ IMPORTANT CONSEQUENCES:
• You cannot return to change any answers

• Your final competition results will be submitted
• Both Round 1 and Round 2 will be permanently closed
• This action cannot be undone
• You will be redirected to the final leaderboard

Current Status:
• Questions Answered: ${getSubmittedCount()}/${questions.length}
• Total Score: ${totalScore}/${questions.length * 20} points
• Violations: ${violationCount}`,
      confirmText: 'Yes, Complete Competition',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      // Set completion flag in localStorage
      localStorage.setItem('round2_completed', 'true');
      
      // Log completion
      addViolation('MANUAL_END', 'Round 2 completed manually by participant');
      endSession();
      
      // Clear progress data
      localStorage.removeItem('round2_progress');
      
      // Navigate to leaderboard
      router.replace('/leaderboard');
    }
  };

  const handleQuerySubmit = async (queryPayload) => {
    setLoading(true);
    try {
      const payload = {
        ...queryPayload,
        participantId: participant._id,
        questionId: currentQuestion.id,
        round: 2,
        sessionData: {
          timeElapsed: sessionData ? Math.floor((Date.now() - sessionData.startTime) / 1000) : 0,
          violationsCount: violationCount
        }
      };

      const response = await fetch('/api/submit/round2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        const newSubmissions = {
          ...submissions,
          [currentQuestion.id]: data.result
        };
        const newTotalScore = data.result.newTotalScore;
        
        setResult(data);
        setSubmissions(newSubmissions);
        setTotalScore(newTotalScore);
        
        // Save progress
        const progress = {
          submissions: newSubmissions,
          totalScore: newTotalScore,
          timestamp: Date.now()
        };
        localStorage.setItem('round2_progress', JSON.stringify(progress));
        
        addViolation('SUBMISSION', `Submitted answer for Question ${currentQuestion.id}`);
      } else {
        setResult({ error: data.error || 'Submission failed' });
      }
    } catch (error) {
      setResult({ error: 'Network error: ' + error.message });
      addViolation('SUBMISSION_ERROR', `Submission failed: ${error.message}`);
    }
    setLoading(false);
  };

// Add this useEffect in both Round1Page and Round2Page
useEffect(() => {
  // Clear previous result when switching questions
  setResult(null);
}, [currentQuestion?.id]); // Depend on question ID

// Also modify the handleQueryRun to include question context
const handleQueryRun = async (queryPayload) => {
  setLoading(true);
  setResult(null); // Clear any previous results
  
  try {
    const payload = {
      ...queryPayload,
      participantId: participant._id,
      questionId: currentQuestion.id,
      round: 2, // or 2 for round 2
      preview: true,
    };

    const response = await fetch('/api/run-query/round2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // Only set result if still on same question
    if (currentQuestion?.id === queryPayload.questionId) {
      if (data.success) {
        setResult({
          ...data,
          isPreview: true
        });
      } else {
        setResult({ error: data.error || 'Query execution failed' });
      }
    }
  } catch (error) {
    if (currentQuestion?.id === queryPayload.questionId) {
      setResult({ error: 'Network error: ' + error.message });
    }
  }
  setLoading(false);
};


  const getSubmittedCount = () => Object.keys(submissions).length;
  const getScoreByQuestionId = (questionId) => submissions[questionId] || null;

  if (!round1Complete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (showEntryModal) {
    return (
      <RoundEntryModal
        roundNumber={2}
        onConfirm={handleRoundStart}
        onCancel={() => router.push('/competition')}
      />
    );
  }

  if (!participant) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Enhanced Proctoring Status Bar */}
      <div className="bg-red-600 text-white px-4 py-2 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              🔴 <span className="ml-1">LIVE PROCTORING</span>
            </span>
            <span>Time: {formatTime()}</span>
            <span className={`${violationCount >= 5 ? 'text-yellow-300 font-bold animate-pulse' : ''}`}>
              Violations: {violationCount}/5
            </span>
            {violationCount >= 5 && (
              <span className="text-yellow-300 font-bold">
                ⚠️ FINAL WARNING
              </span>
            )}
            {hasBeenEjected && (
              <span className="text-red-300 font-bold">
                ❌ EJECTED
              </span>
            )}
          </div>
          <div className="text-xs opacity-75">
            Session monitored • Academic integrity enforced
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Round 2 - Aggregation Pipelines</h1>
                <p className="text-m text-gray-600">MongoDB Aggregation Framework Operations</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {totalScore}/{questions.length * 20} points
                </div>
                <div className="text-sm text-gray-500">
                  {getSubmittedCount()}/{questions.length} questions completed
                </div>
                <button
                  onClick={handleCompleteRound}
                  disabled={hasBeenEjected}
                  className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    hasBeenEjected 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {hasBeenEjected ? 'Test Ended' : 'Complete Round'}
                </button>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-100 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getSubmittedCount() / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Questions ({questions.length})</h2>
              <div className="space-y-3">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onSubmit={setCurrentQuestion}
                    isSubmitted={!!submissions[question.id]}
                    score={getScoreByQuestionId(question.id)}
                    isLoading={loading && currentQuestion?.id === question.id}
                    disabled={hasBeenEjected}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {currentQuestion ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Question {currentQuestion.id}: {currentQuestion.title}
                      </h2>
                      <p className="text-gray-600 mt-2 text-sm">{currentQuestion.description}</p>
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQuestion.points || 20} points
                    </span>
                  </div>
                </div>

                {!submissions[currentQuestion.id] && !hasBeenEjected ? (
                  <QueryEditor
                    mode="aggregate"
                    question={currentQuestion}
                    onSubmit={handleQuerySubmit}
                    onRunQuery={handleQueryRun} 
                    isLoading={loading}
                    disabled={hasBeenEjected}
                  />
                ) : submissions[currentQuestion.id] ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-800 font-medium">
                        Question submitted! Score: {submissions[currentQuestion.id]?.score?.total || 0}/{currentQuestion.points || 20}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-800 font-medium">
                        Test ended due to violations. Cannot submit answers.
                      </span>
                    </div>
                  </div>
                )}

                <ResultDisplay result={result} isLoading={loading} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {hasBeenEjected ? 'Test Ended' : 'Select a Question'}
                </h3>
                <p className="text-gray-600">
                  {hasBeenEjected 
                    ? 'You have been ejected from the test due to violations'
                    : 'Choose a question from the left panel to start solving'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
