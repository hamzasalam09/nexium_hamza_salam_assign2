import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

export async function POST(request: Request) {
  try {
    const { url, englishSummary, urduSummary, fullText } = await request.json();

    // Supabase client
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // MongoDB client
    const mongoClient = new MongoClient(config.mongodb.uri);

    try {
      // Save summary to Supabase
      const { error: supabaseError } = await supabase
        .from('blog_summaries')
        .insert([{
          url,
          summary: englishSummary,
          urduSummary
        }]);

      if (supabaseError) throw supabaseError;

      // Save full text to MongoDB
      await mongoClient.connect();
      const db = mongoClient.db('blog_summarizer');
      await db.collection('full_texts').insertOne({
        url,
        fullText,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true });
    } finally {
      await mongoClient.close();
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}
