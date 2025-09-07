export function calculateScore(userResult, canonicalResult, queryPerformance, maxPoints = 15) {
  // Initialize scores
  let correctnessScore = 0;
  let performanceScore = 0;
  
  // Handle empty or error results
  if (!userResult || userResult.length === 0) {
    return {
      total: 0,
      correctnessScore: 0,
      performanceScore: 0,
      isCorrect: false,
      feedback: "No results returned"
    };
  }

  if (!canonicalResult || canonicalResult.length === 0) {
    return {
      total: 0,
      correctnessScore: 0,
      performanceScore: 0,
      isCorrect: false,
      feedback: "No canonical results to compare"
    };
  }

  // Correctness calculation
  const userSet = new Set(userResult.map(doc => JSON.stringify(sortObject(doc))));
  const canonicalSet = new Set(canonicalResult.map(doc => JSON.stringify(sortObject(doc))));
  
  // Exact match check
  if (userSet.size === canonicalSet.size && 
      [...userSet].every(item => canonicalSet.has(item))) {
    correctnessScore = Math.floor(maxPoints * 0.7); // 70% for correctness
    performanceScore = Math.floor(maxPoints * 0.3); // 30% for performance
    
    return {
      total: correctnessScore + performanceScore,
      correctnessScore,
      performanceScore,
      isCorrect: true,
      feedback: "Perfect match!"
    };
  }

  // Partial match calculation
  const intersection = [...userSet].filter(item => canonicalSet.has(item));
  const partialRatio = intersection.length / canonicalSet.size;
  
  // Only give partial points if there's meaningful overlap (>= 20%)
  if (partialRatio >= 0.2) {
    correctnessScore = Math.floor(maxPoints * 0.7 * partialRatio);
    // Only add performance score if correctness threshold is met
    if (partialRatio >= 0.5) {
      performanceScore = Math.floor(maxPoints * 0.3 * 0.5); // Reduced performance score for partial
    }
    
    return {
      total: correctnessScore + performanceScore,
      correctnessScore,
      performanceScore,
      isCorrect: false,
      feedback: `Partial match: ${Math.round(partialRatio * 100)}% correct`
    };
  }

  return {
    total: 0,
    correctnessScore: 0,
    performanceScore: 0,
    isCorrect: false,
    feedback: "Results don't match expected output"
  };
}

function sortObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObject(obj[key]);
  });
  return sorted;
}

