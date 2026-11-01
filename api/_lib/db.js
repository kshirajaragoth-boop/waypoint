'use strict';

const { MongoClient } = require('mongodb');

let clientPromise;
let indexesPromise;

async function getDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });
    clientPromise = client.connect().catch(error => {
      clientPromise = null;
      throw error;
    });
  }
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'waypoint');
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('workspaces').createIndex({ userId: 1 }, { unique: true })
    ]).catch(error => {
      indexesPromise = null;
      throw error;
    });
  }
  await indexesPromise;
  return db;
}

module.exports = { getDb };
