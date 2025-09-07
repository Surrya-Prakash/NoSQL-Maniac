import { getDatasetDB, getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { 
      participantId, 
      questionId, 
      round = 1,
      // Round 1 fields
      filter, 
      projection, 
      sort, 
      skip, 
      limit,
      // Round 2 fields
      pipeline,
      collection: collectionName,
      preview = true
    } = await request.json();

    if (!participantId || !questionId) {
      return NextResponse.json({ error: 'Missing participant or question ID' }, { status: 400 });
    }

    const datasetDB = await getDatasetDB();
    const client = await getMongoClient();
    const competitionDB = client.db('competition');

    // Get question from appropriate collection
    const questionCollection = round === 1 ? 'first_round' : 'second_round';
    const question = await competitionDB.collection(questionCollection).findOne({ id: questionId });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    let userResult = [];
    let queryError = null;
    
    try {
      const collection = datasetDB.collection(collectionName || question.collection);
      
      if (round === 1) {
        // Handle find queries
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
      } else if (round === 2) {
        // Handle aggregate queries
        if (!pipeline || !Array.isArray(pipeline)) {
          throw new Error('Pipeline must be an array for aggregation queries');
        }
        userResult = await collection.aggregate(pipeline).toArray();
      }
    } catch (error) {
      queryError = error.message;
      userResult = [];
    }

    // Execute canonical solution
    let canonicalResult = [];
    try {
      const canonicalSolution = question.canonicalSolution;
      const collection = datasetDB.collection(canonicalSolution.coll);
      
      if (round === 1) {
        let query = collection.find(canonicalSolution.filter || {});
        if (canonicalSolution.projection) query = query.project(canonicalSolution.projection);
        if (canonicalSolution.sort) query = query.sort(canonicalSolution.sort);
        if (canonicalSolution.skip) query = query.skip(canonicalSolution.skip);
        if (canonicalSolution.limit) query = query.limit(canonicalSolution.limit);
        canonicalResult = await query.toArray();
      } else if (round === 2) {
        if (canonicalSolution.pipeline) {
          canonicalResult = await collection.aggregate(canonicalSolution.pipeline).toArray();
        }
      }
    } catch (error) {
      console.error('Canonical query error:', error);
    }

    return NextResponse.json({
      success: true,
      preview: true,
      userResult,
      expectedResult: canonicalResult,
      queryError,
      round,
      question: {
        id: question.id,
        title: question.title,
        description: question.description
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

