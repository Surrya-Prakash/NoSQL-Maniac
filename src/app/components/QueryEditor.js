'use client';
import { useState } from 'react';

export default function QueryEditor({ 
  mode = 'find', 
  onSubmit,
  onRunQuery, // New prop for run-only functionality
  isLoading = false,
  question = null
}) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');



  const parseMongoCommand = (commandStr) => {
    // Your existing parseMongoCommand function (keeping it as is)
    try {
      const cleanCommand = commandStr.trim().replace(/\s+/g, ' ');
      
      const collectionMatch = cleanCommand.match(/db\.(\w+)\./);
      if (!collectionMatch) {
        throw new Error('Invalid MongoDB command format. Should start with db.collection.');
      }
      
      const collection = collectionMatch[1];
      
      if (cleanCommand.includes('.find(')) {
        const findRegex = /\.find\(\s*(.*?)\s*\)/s;
        const findMatch = cleanCommand.match(findRegex);
        
        if (!findMatch) {
          throw new Error('Invalid find() syntax');
        }
        
        const paramsStr = findMatch[1].trim();
        let filter = {}, projection = {};
        
        if (paramsStr) {
          const parts = [];
          let current = '';
          let braceDepth = 0;
          let inString = false;
          let stringChar = '';
          
          for (let i = 0; i < paramsStr.length; i++) {
            const char = paramsStr[i];
            const prevChar = i > 0 ? paramsStr[i - 1] : '';
            
            if ((char === '"' || char === "'") && prevChar !== '\\') {
              if (!inString) {
                inString = true;
                stringChar = char;
              } else if (char === stringChar) {
                inString = false;
                stringChar = '';
              }
            }
            
            if (!inString) {
              if (char === '{') braceDepth++;
              if (char === '}') braceDepth--;
              
              if (char === ',' && braceDepth === 0) {
                parts.push(current.trim());
                current = '';
                continue;
              }
            }
            
            current += char;
          }
          
          if (current.trim()) parts.push(current.trim());
          
          if (parts[0]) {
            try {
              filter = Function('"use strict"; return (' + parts[0] + ')')();
            } catch (e) {
              throw new Error('Invalid filter syntax: ' + parts[0]);
            }
          }
          
          if (parts[1]) {
            try {
              projection = Function('"use strict"; return (' + parts[1] + ')')();
            } catch (e) {
              throw new Error('Invalid projection syntax: ' + parts[1]);
            }
          }
        }
        
        const chainedMethods = {};
        
        const limitMatch = cleanCommand.match(/\.limit\(\s*(\d+)\s*\)/);
        if (limitMatch) chainedMethods.limit = parseInt(limitMatch[1]);
        
        const skipMatch = cleanCommand.match(/\.skip\(\s*(\d+)\s*\)/);
        if (skipMatch) chainedMethods.skip = parseInt(skipMatch[1]);
        
        const sortMatch = cleanCommand.match(/\.sort\(\s*([^)]+)\s*\)/);
        if (sortMatch) {
          try {
            chainedMethods.sort = Function('"use strict"; return (' + sortMatch[1] + ')')();
          } catch (e) {
            throw new Error('Invalid sort syntax: ' + sortMatch[1]);
          }
        }
        
        return {
          type: 'find',
          collection,
          filter,
          projection,
          ...chainedMethods
        };
      }
      
      if (cleanCommand.includes('.aggregate(')) {
        const aggMatch = cleanCommand.match(/\.aggregate\(\s*(\[.*?\])\s*\)/s);
        if (!aggMatch) {
          throw new Error('Invalid aggregate() syntax');
        }
        
        try {
          const pipeline = Function('"use strict"; return (' + aggMatch[1] + ')')();
          
          if (!Array.isArray(pipeline)) {
            throw new Error('Pipeline must be an array');
          }
          
          return {
            type: 'aggregate',
            collection,
            pipeline
          };
        } catch (e) {
          throw new Error('Invalid pipeline syntax: ' + e.message);
        }
      }
      
      throw new Error('Unsupported command type. Use find() or aggregate()');
      
    } catch (error) {
      throw new Error(`Parse error: ${error.message}`);
    }
  };

  // Handle form submission with button detection
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!query.trim()) {
      setError('Please enter a MongoDB command');
      return;
    }
    
    try {
      const parsedQuery = parseMongoCommand(query);
      const queryPayload = {
        ...parsedQuery,
        rawQuery: query
      };

      // Check which button was clicked
      const clickedButton = e.nativeEvent.submitter.name;
      
      if (clickedButton === 'run') {
        // Just run query without submitting
        onRunQuery && onRunQuery(queryPayload);
      } else if (clickedButton === 'submit') {
        // Submit query for scoring
        onSubmit(queryPayload);
      }
      
    } catch (parseError) {
      setError(parseError.message);
    }
  };

  const placeholder = mode === 'find' 
    ? `db.${question?.collection || 'movies'}.find(
  { "year": { "$gte": 2020 } },
  { "title": 1, "year": 1, "_id": 0 }
).limit(10)`
    : `db.${question?.collection || 'movies'}.aggregate([
  { "$match": { "year": { "$gte": 2020 } } },
  { "$group": { "_id": "$genre", "count": { "$sum": 1 } } },
  { "$sort": { "count": -1 } }
])`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          MongoDB Shell Query Editor
        </h3>
        <span className="text-sm text-gray-500">
          Collection: <code className="bg-gray-100 px-2 py-1 rounded">{question?.collection}</code>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter MongoDB Command
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y placeholder-gray-500"
            style={{ 
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              color: '#1f2937'
            }}
          />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Two buttons: Run Query and Submit Query */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-xs text-gray-500">
            💡 Tip: Use "Run Query" to preview results before submitting
          </div>
          
          <div className="flex space-x-3">
            {/* Run Query Button (Preview) */}
            <button
              type="submit"
              name="run"
              disabled={isLoading}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running...
                </div>
              ) : (
                '🔍 Run Query'
              )}
            </button>

            {/* Submit Query Button (Final) */}
            <button
              type="submit"
              name="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                '✅ Submit Query'
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Example Commands:</h4>
        <div className="text-xs text-gray-600 space-y-2 font-mono">
          <div><strong>Find:</strong></div>
          <div className="bg-white p-2 rounded border">
            {`db.movies.find({ "year": 2020 }, { "title": 1, "_id": 0 }).limit(5)`}
          </div>
          
          <div><strong>Aggregate:</strong></div>
          <div className="bg-white p-2 rounded border">
            {`db.movies.aggregate([
  { "$match": { "year": { "$gte": 2020 } } },
  { "$group": { "_id": "$genre", "count": { "$sum": 1 } } }
])`}
          </div>
        </div>
      </div>
    </div>
  );
}


