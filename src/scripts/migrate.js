const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    
    const db = client.db('scoring');
    
    // Create participant_scores collection with indexes
    const scoresCollection = db.collection('participant_scores');
    
    // Create indexes for better performance
    await scoresCollection.createIndex({ participantId: 1, questionId: 1, round: 1 }, { unique: true });
    await scoresCollection.createIndex({ participantId: 1 });
    await scoresCollection.createIndex({ questionId: 1 });
    await scoresCollection.createIndex({ submittedAt: -1 });
    await scoresCollection.createIndex({ totalScore: -1 });
    
    console.log('✅ Created participant_scores collection with indexes');
    
    // Optionally migrate existing data if you have any
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();
