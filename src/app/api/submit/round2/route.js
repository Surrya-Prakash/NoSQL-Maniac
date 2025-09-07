import { getDatasetDB, getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { calculateScore } from '@/lib/scoring';

export async function POST(request) {
  try {
    const { 
      participantId, 
      questionId, 
      pipeline,
      collection: collectionName,
      round = 2
    } = await request.json();

    if (!participantId || !questionId || !pipeline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(pipeline)) {
      return NextResponse.json({ error: 'Pipeline must be an array' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Database connections
    const datasetDB = await getDatasetDB();
    const client = await getMongoClient();
    const competitionDB = client.db('competition');
    const scoringDB = client.db('scoring');
    const authDB = client.db('authentication');

    // Fetch question
    const question = await competitionDB.collection('second_round').findOne({ id: questionId });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Execute user aggregation pipeline
    let userResult = [];
    let queryError = null;
    
    try {
      const collection = datasetDB.collection(collectionName || question.collection);
      userResult = await collection.aggregate(pipeline).toArray();
    } catch (error) {
      queryError = error.message;
      userResult = [];
    }

    const userExecutionTime = Date.now() - startTime;

    // Execute canonical aggregation pipeline
    let canonicalResult = [];
    try {
      const canonicalSolution = question.canonicalSolution;
      const collection = datasetDB.collection(canonicalSolution.coll);
      
      canonicalResult = await collection.aggregate(canonicalSolution.pipeline).toArray();
    } catch (error) {
      console.error('Canonical pipeline error:', error);
    }

    // Calculate score
    const scoreResult = calculateScore(
      userResult, 
      canonicalResult, 
      { executionTime: userExecutionTime }, 
      question.points || 20
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
      userQuery: { pipeline },
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
    console.error('Round 2 submission error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Submission failed: ' + error.message 
    }, { status: 500 });
  }
}



