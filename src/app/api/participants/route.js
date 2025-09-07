import * as mongodb from '@/lib/mongodb';
// Then use: const authDB = await mongodb.getAuthDB();

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

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
    console.error('Fetch participant error:', error);
    return NextResponse.json({ error: 'Failed to fetch participant' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { participantId, updates } = await request.json();
    
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    const authDB = await getAuthDB();
    const result = await authDB.collection('participants').updateOne(
      { _id: new ObjectId(participantId) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Update participant error:', error);
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
  }
}
