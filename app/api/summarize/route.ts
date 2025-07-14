import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

export async function POST(request: Request) {
  // Validate environment variables
  if (!config.supabase.url || !config.supabase.key) {
    console.error('Missing Supabase configuration');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!config.mongodb.uri) {
    console.error('Missing MongoDB configuration');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  let mongoClient: MongoClient | null = null;

  try {
    // Validate request body
    const body = await request.json();
    const { url, englishSummary, urduSummary, fullText } = body;

    if (!url || !englishSummary || !urduSummary || !fullText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Initialize MongoDB client
    mongoClient = new MongoClient(config.mongodb.uri);
    await mongoClient.connect();

    // Save summary to Supabase
    const { error: supabaseError } = await supabase
      .from('blog_summaries')
      .insert([{
        url,
        summary: englishSummary,
        urdu_summary: urduSummary,
        created_at: new Date().toISOString()
      }]);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      throw new Error('Failed to save summary to Supabase');
    }

    // Save full text to MongoDB
    const db = mongoClient.db('blog_summarizer');
    await db.collection('full_texts').insertOne({
      url,
      fullText,
      timestamp: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Successfully saved summary and full text'
    });

  } catch (error) {
    console.error('Error in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Ensure MongoDB connection is closed
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
}
