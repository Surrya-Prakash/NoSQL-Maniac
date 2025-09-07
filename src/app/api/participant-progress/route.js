import { getScoringDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    const db = await getScoringDB();
    const scores = await db
      .collection('participant_scores')
      .find({ participantId })
      .toArray();

    // Check if round 1 is complete (all 20 questions answered)
    const round1Scores = scores.filter(s => s.round === 1);
    const round2Scores = scores.filter(s => s.round === 2);

    const round1Complete = round1Scores.length >= 20;
    const round2Complete = round2Scores.length >= 8;

    return NextResponse.json({
      round1Complete,
      round2Complete,
      round1Questions: round1Scores.length,
      round2Questions: round2Scores.length,
      totalScore: scores.reduce((sum, score) => sum + (score.totalScore || 0), 0)
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
