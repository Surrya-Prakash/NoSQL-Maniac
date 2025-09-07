import { getDatasetDB, getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { calculateScore } from '@/lib/scoring';

export async function POST(request) {
  try {
    const { 
      participantId, 
      questionId, 
      filter, 
      projection, 
      sort, 
      skip, 
      limit,
      collection: collectionName,
      round = 1
    } = await request.json();

    if (!participantId || !questionId) {
      return NextResponse.json({ error: 'Missing participant or question ID' }, { status: 400 });
    }

    const startTime = Date.now();

    // Database connections
    const datasetDB = await getDatasetDB();
    const client = await getMongoClient();
    const competitionDB = client.db('competition');
    const scoringDB = client.db('scoring');
    const authDB = client.db('authentication');

    // Fetch question
    const question = await competitionDB.collection('first_round').findOne({ id: questionId });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Execute user's find query
    let userResult = [];
    let queryError = null;
    
    try {
      const collection = datasetDB.collection(collectionName || question.collection);
      let query = collection.find(filter || {});
      
      if (projection && Object.keys(projection).length > 0) {
        query = query.project(projection);
      }
      
      if (sort && Object.keys(sort).length > 0) {
        query = query.sort(sort);
      }
      
      if (skip && skip > 0) {
        query = query.skip(parseInt(skip));
      }
      
      if (limit && limit > 0) {
        query = query.limit(parseInt(limit));
      }
      
      userResult = await query.toArray();
    } catch (error) {
      queryError = error.message;
      userResult = [];
    }
    
    const userExecutionTime = Date.now() - startTime;

    // Execute canonical query (transform your existing structure)
    let canonicalResult = [];
    try {
      const canonicalSolution = question.canonicalSolution;
      const collection = datasetDB.collection(canonicalSolution.coll);
      
      let canonicalQuery = collection.find(canonicalSolution.filter || {});
      
      if (canonicalSolution.projection) {
        canonicalQuery = canonicalQuery.project(canonicalSolution.projection);
      }
      
      if (canonicalSolution.sort) {
        canonicalQuery = canonicalQuery.sort(canonicalSolution.sort);
      }
      
      if (canonicalSolution.skip) {
        canonicalQuery = canonicalQuery.skip(canonicalSolution.skip);
      }
      
      if (canonicalSolution.limit) {
        canonicalQuery = canonicalQuery.limit(canonicalSolution.limit);
      }
      
      canonicalResult = await canonicalQuery.toArray();
    } catch (error) {
      console.error('Canonical query error:', error);
    }

    // Calculate score
    const scoreResult = calculateScore(
      userResult, 
      canonicalResult, 
      { executionTime: userExecutionTime }, 
      question.points || 15
    );

    // Get participant name
    const participant = await authDB.collection('participants').findOne({ _id: participantId });

    // Save to scoring collection
    const scoreDocument = {
      participantId,
      participantName: participant?.name || 'Unknown',
      questionId,
      round,
      totalScore: scoreResult.total,
      correctnessScore: scoreResult.correctness,
      performanceScore: scoreResult.performance,
      submittedAt: new Date(),
      completionTime: userExecutionTime,
      userQuery: { filter, projection, sort, skip, limit },
      userResult: userResult.slice(0, 10),
      canonicalResult: canonicalResult.slice(0, 10),
      isCorrect: scoreResult.isCorrect,
      feedback: scoreResult.feedback,
      queryError
    };

    await scoringDB.collection('participant_scores').insertOne(scoreDocument);

    // Calculate total score
    const allScores = await scoringDB.collection('participant_scores').find({ participantId }).toArray();
    const newTotalScore = allScores.reduce((sum, score) => sum + (score.totalScore || 0), 0);

    return NextResponse.json({
      success: true,
      result: {
        score: scoreResult,
        userResult,
        canonicalResult,
        executionTime: userExecutionTime,
        newTotalScore,
        questionId,
        feedback: scoreResult.feedback
      }
    });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Submission failed: ' + error.message 
    }, { status: 500 });
  }
}
