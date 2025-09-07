import { getCompetitionDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getCompetitionDB();
    const questions = await db.collection('first_round')
      .find({})
      .sort({ id: 1 })
      .toArray();
    
    // Remove canonical solution from response for security
    const questionsForUI = questions.map(({ canonicalSolution, ...question }) => ({
      ...question,
      maxPoints: 5 // Each question worth 5 points in Round 1
    }));
    
    return NextResponse.json({
      questions: questionsForUI,
      totalQuestions: questionsForUI.length,
      maxScore: questionsForUI.length * 5,
      timeLimit: 90 // 1.5 hours in minutes
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
