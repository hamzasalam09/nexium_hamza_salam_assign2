import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';
import { config } from '../config';

// Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

// MongoDB client
const mongoClient = new MongoClient(config.mongodb.uri);

export async function saveSummaryToSupabase(summary: {
  url: string;
  summary: string;
  urduSummary: string;
}) {
  try {
    const { error } = await supabase
      .from('blog_summaries')
      .insert([summary]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
}

export async function saveFullTextToMongoDB(data: {
  url: string;
  fullText: string;
  timestamp: Date;
}) {
  try {
    await mongoClient.connect();
    const db = mongoClient.db('blog_summarizer');
    await db.collection('full_texts').insertOne(data);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    throw error;
  } finally {
    await mongoClient.close();
  }
}
