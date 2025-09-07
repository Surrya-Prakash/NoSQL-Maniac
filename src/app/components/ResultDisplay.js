'use client';
import { useState } from 'react';

export default function ResultDisplay({ result, isLoading = false }) {
  const [activeTab, setActiveTab] = useState('userResult');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Executing query...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500 py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4" />
          </svg>
          <p>Submit a query to see results here</p>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Query Error</h3>
              <p className="text-sm text-red-700 mt-1">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'userResult', label: 'Your Results', count: result.result?.userResult?.length || 0 },
    { id: 'expected', label: 'Expected Results', count: result.result?.canonicalResult?.length || 0 },
    { id: 'score', label: 'Score Analysis', count: null }
  ];

  const formatJSON = (data) => {
    return JSON.stringify(data, null, 2);
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    const percentage = (score.total / score.maxTotal) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Score Header */}
      {result.result?.score && (
        <div className={`p-4 border-b ${result.result.score.isCorrect ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {result.result.score.isCorrect ? (
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <h3 className="text-lg font-semibold text-gray-800">
                {result.result.score.isCorrect ? 'Correct Answer!' : 'Partial Credit'}
              </h3>
            </div>
            <div className={`text-xl font-bold ${getScoreColor(result.result.score)}`}>
              {result.result.score.total}/{result.result.score.maxTotal} points
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-6 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'userResult' && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Your  Results ({result.result?.userResult?.length || 0} documents)</h4>
          <pre className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-96 text-sm text-gray-900 font-mono">
  {formatJSON(result.result?.userResult || [])}
</pre>

          </div>
        )}

       {activeTab === 'expected' && (
  <div>
    <h4 className="font-medium text-gray-800 mb-3">Expected Results ({result.result?.canonicalResult?.length || 0} documents)</h4>
    {/* Conditional rendering to prevent showing canonical solution for empty submissions */}
    {!result.result?.userResult || result.result.userResult.length === 0 ? (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 italic">No query submitted yet. Expected results will appear after you submit a query.</p>
      </div>
    ) : (
      <pre className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96 text-sm text-gray-900 font-mono">
        {formatJSON(result.result?.canonicalResult || [])}
      </pre>
    )}
  </div>
)}


        {activeTab === 'score' && result.result?.score && (
          <div>
            <h4 className="font-medium text-gray-800 mb-4">Score Breakdown</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Correctness</div>
                    <div className="text-xl font-bold text-blue-600">
                      {result.result.score.correctness}/{result.result.score.maxCorrectness}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(result.result.score.correctness / result.result.score.maxCorrectness) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Performance</div>
                    <div className="text-xl font-bold text-green-600">
                      {result.result.score.performance}/{result.result.score.maxPerformance}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(result.result.score.performance / result.result.score.maxPerformance) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-800">Total Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(result.result.score)}`}>
                      {result.result.score.total}/{result.result.score.maxTotal}
                    </span>
                  </div>
                  {result.result.executionTime && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Execution Time</span>
                      <span className="text-sm font-medium">{result.result.executionTime}ms</span>
                    </div>
                  )}
                  {result.result.newTotalScore !== undefined && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="text-lg font-medium text-gray-800">New Total Score</span>
                      <span className="text-lg font-bold text-blue-600">{result.result.newTotalScore} points</span>
                    </div>
                  )}
                </div>
              </div>
              
              {result.result.score.isCorrect && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Perfect match! Your query returned the exact expected results.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
