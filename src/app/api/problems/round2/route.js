import { getCompetitionDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getCompetitionDB();
    const questions = await db.collection('second_round')
      .find({})
      .sort({ id: 1 })
      .toArray();
    
    const questionsForUI = questions.map(({ canonicalSolution, ...question }) => ({
      ...question,
      maxPoints: 10 // Each question worth 10 points in Round 2
    }));
    
    return NextResponse.json({
      questions: questionsForUI,
      totalQuestions: questionsForUI.length,
      maxScore: questionsForUI.length * 10,
      timeLimit: 90 // 1.5 hours in minutes
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
