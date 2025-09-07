import { getScoringDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getScoringDB();
    
    const leaderboard = await db.collection('participant_scores').aggregate([
      {
        $group: {
          _id: '$participantId',
          participantName: { $first: '$participantName' },
          totalScore: { $sum: '$totalScore' },
          questionsAnswered: { $sum: 1 },
          averageTime: { $avg: '$completionTime' },
          lastSubmission: { $max: '$submittedAt' }
        }
      },
      {
        $addFields: {
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

    // Add ranking
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

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
