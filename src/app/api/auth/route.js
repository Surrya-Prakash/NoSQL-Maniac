import { getAuthDB, getScoringDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, action } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    const authDB = await getAuthDB();
    const scoringDB = await getScoringDB();
    
    if (action === 'login') {
      // Check if participant exists
      let participant = await authDB.collection('participants').findOne({ email });
      
      if (!participant) {
        // Create new participant
        const newParticipant = {
          name,
          email,
          joinedAt: new Date(),
          isActive: true,
          currentRound: 1,
          round1Completed: false,
          round2Completed: false
        };
        
        const result = await authDB.collection('participants').insertOne(newParticipant);
        participant = { ...newParticipant, _id: result.insertedId };
        
        // Initialize scoring records
        await scoringDB.collection('participant_scores').insertMany([
          {
            participantId: participant._id.toString(),
            round: 'round1',
            totalScore: 0,
            maxPossibleScore: 75, // 15 questions × 5 points
            questionsAttempted: 0,
            questionsCorrect: 0,
            submissions: [],
            startedAt: new Date(),
            completedAt: null,
            timeSpent: 0
          },
          {
            participantId: participant._id.toString(),
            round: 'round2',
            totalScore: 0,
            maxPossibleScore: 80, // 8 questions × 10 points  
            questionsAttempted: 0,
            questionsCorrect: 0,
            submissions: [],
            startedAt: null,
            completedAt: null,
            timeSpent: 0
          }
        ]);
      }
      
      return NextResponse.json({ 
        success: true, 
        participant: {
          _id: participant._id.toString(),
          name: participant.name,
          email: participant.email,
          currentRound: participant.currentRound,
          round1Completed: participant.round1Completed,
          round2Completed: participant.round2Completed
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }
    
    const authDB = await getAuthDB();
    const participant = await authDB.collection('participants').findOne({
      _id: new ObjectId(participantId)
    });
    
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch participant' }, { status: 500 });
  }
}
