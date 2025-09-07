import { getDatasetDB, getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

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
      preview = true
    } = await request.json();

    if (!participantId || !questionId) {
      return NextResponse.json({ error: 'Missing participant or question ID' }, { status: 400 });
    }

    const startTime = Date.now();

    // Database connections
    const datasetDB = await getDatasetDB();
    const client = await getMongoClient();
    const competitionDB = client.db('competition');

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

    // Execute canonical query for comparison
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
      console.error('Canonical query execution error:', error);
    }

    // Return results for preview (no scoring)
    return NextResponse.json({
      success: true,
      preview: true,
      userResult,
      expectedResult: canonicalResult,
      queryError,
      executionTime: userExecutionTime,
      question: {
        id: question.id,
        title: question.title,
        description: question.description
      }
    });

  } catch (error) {
    console.error('Run query error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
