import { getMongoClient } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { participantId, roundNumber, violation } = await request.json();

    const client = await getMongoClient();
    const proctorDB = client.db('proctoring');
    
    const violationDocument = {
      participantId,
      roundNumber,
      ...violation,
      createdAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    await proctorDB.collection('violations').insertOne(violationDocument);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Violation logging error:', error);
    return NextResponse.json({ error: 'Failed to log violation' }, { status: 500 });
  }
}
