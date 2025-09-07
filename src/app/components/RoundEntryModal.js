'use client';

export default function RoundEntryModal({ roundNumber, onConfirm, onCancel }) {
  const getSpecialFeatures = (round) => {
    if (round === 1) return "🔍 Find operations - 15 points each";
    if (round === 2) return "⚡ Aggregation pipelines - 20 points each";
    return "";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🔒 Proctored Test Environment - Round {roundNumber}
          </h3>
          <div className="text-sm text-gray-600 space-y-3 mb-6 text-left">
            <p><strong>⚠️ IMPORTANT - This is a monitored test:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>🚫 Tab switching will be detected and logged</li>
              <li>🚫 Right-click and keyboard shortcuts are disabled</li>
              <li>🚫 Copy/paste attempts will be monitored</li>
              <li>⏰ Timer continues even if you navigate away</li>
              <li>📊 All violations are recorded and reviewed</li>
              <li>🖥️ Test will run in fullscreen mode</li>
              <li>❌ Excessive violations may result in disqualification</li>
              <li>{getSpecialFeatures(roundNumber)}</li>
            </ul>
            <p className="text-red-600 font-semibold text-xs">
              By starting, you agree to follow academic integrity policies.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              I Understand - Start Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

