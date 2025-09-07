import { getScoringDB, getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const scoringDB = await getScoringDB();
    const client = await getMongoClient();
    const authDB = client.db('authentication');
    
    // Fixed aggregation - only count submission documents that have questionId
    const leaderboard = await scoringDB.collection('participant_scores').aggregate([
      {
        // Filter only actual submissions (not setup docs)
        $match: {
          questionId: { $exists: true },
          totalScore: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$participantId',
          totalScore: { $sum: '$totalScore' },
          uniqueQuestions: { $addToSet: '$questionId' }, // Count unique questions
          averageTime: { $avg: '$completionTime' },
          lastSubmission: { $max: '$submittedAt' }
        }
      },
      {
        $addFields: {
          questionsAnswered: { $size: '$uniqueQuestions' }, // Convert set to count
          efficiency: {
            $divide: ['$totalScore', { $add: ['$averageTime', 1] }]
          }
        }
      },
      {
        $sort: {
          totalScore: -1,
          efficiency: -1,
          lastSubmission: 1
        }
      },
      {
        $limit: 50
      }
    ]).toArray();

    if (leaderboard.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: []
      });
    }

    // Convert string participantIds to ObjectIds for matching
    const participantIds = leaderboard.map(entry => new ObjectId(entry._id));
    const participants = await authDB.collection('participants').find({
      _id: { $in: participantIds }
    }).toArray();

    // Create participant name mapping (ObjectId to string)
    const participantMap = {};
    participants.forEach(participant => {
      participantMap[participant._id.toString()] = participant.name || participant.email || 'Anonymous';
    });

    // Add participant names to leaderboard entries
    const leaderboardWithNames = leaderboard.map(entry => ({
      ...entry,
      participantName: participantMap[entry._id] || 'Anonymous' // entry._id is already a string
    }));

    // Add ranking
    const rankedLeaderboard = leaderboardWithNames.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    // Broadcast via WebSocket
    if (global.io) {
      global.currentLeaderboard = rankedLeaderboard;
      global.io.emit('leaderboard-update', rankedLeaderboard);
      console.log('📡 Broadcasted leaderboard to', global.io.engine.clientsCount, 'clients');
    }

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch leaderboard',
      leaderboard: [] 
    }, { status: 500 });
  }
}



