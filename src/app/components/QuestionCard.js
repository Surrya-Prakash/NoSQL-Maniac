'use client';

export default function QuestionCard({ 
  question, 
  onSubmit, 
  isSubmitted = false, 
  score = null, 
  isLoading = false 
}) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreDisplay = () => {
    if (!score) return '0/15';
    return `${score.score?.total || 0}/${question.points || 15}`;
  };

  const getScoreColor = () => {
    if (!score) return 'text-gray-500';
    const percentage = (score.score?.total || 0) / (question.points || 15);
    if (percentage >= 0.8) return 'text-green-600';
    if (percentage >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div 
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-200
        ${isSubmitted 
          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
        ${isLoading ? 'opacity-75 pointer-events-none' : ''}
      `}
      onClick={() => onSubmit(question)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 mr-2">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
            Q{question.id}: {question.title}
          </h3>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty || 'Medium'}
          </span>
          {isSubmitted && (
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className={`text-xs font-bold ${getScoreColor()}`}>
                {getScoreDisplay()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
        {question.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Collection: {question.collection}
        </span>
        <span className="text-xs font-medium text-blue-600">
          {question.points || 15} pts
        </span>
      </div>

      {/* Score breakdown for submitted questions */}
      {isSubmitted && score && score.score && (
        <div className="mt-3 pt-2 border-t border-green-200">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Correctness:</span>
              <span className="font-medium text-gray-500">{score.score.correctnessScore || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Performance:</span>
              <span className="font-medium text-gray-500">{score.score.performanceScore || 0}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t text-gray-400">
              <span>Total:</span>
              <span className={getScoreColor()}>{score.score.total || 0}</span>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-600">Submitting...</span>
        </div>
      )}
    </div>
  );
}

