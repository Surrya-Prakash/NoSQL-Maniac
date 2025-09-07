import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getAuthDB() {
  const client = await clientPromise;
  return client.db('authentication');
}

export async function getCompetitionDB() {
  const client = await clientPromise;
  return client.db('competition');
}

export async function getScoringDB() {
  const client = await clientPromise;
  return client.db('scoring');
}

export async function getDatasetDB() {
  const client = await clientPromise;
  return client.db('competitionDB');
}


export async function getMongoClient() {
  return await clientPromise;
}

export default clientPromise;
 


