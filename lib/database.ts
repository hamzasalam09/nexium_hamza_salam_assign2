import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { supabase } from './supabase';
import type { ScrapedContent } from './scraper';
import type { SummaryResult } from './cohere';

// MongoDB document interface
export interface BlogDocument {
  _id?: ObjectId | string;
  title: string;
  content: string;
  url: string;
  scrapedAt: Date;
  summary: string;
  summaryUrdu: string;
  keyPoints: string[];
  wordCount: number;
  originalLength: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Supabase record interface  
export interface SummaryRecord {
  id?: number;
  title: string;
  summary: string;
  summary_urdu: string;
  url: string;
  word_count: number;
  original_length: number;
  created_at: string;
  updated_at?: string;
}

// Database operation result
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Connection health status
export interface ConnectionHealth {
  mongodb: boolean;
  supabase: boolean;
  lastChecked: Date;
}

export class DatabaseService {
  private readonly mongoDbName = 'blog_summarizer';
  private readonly mongoCollection = 'blog_posts';
  private readonly supabaseTable = 'blog_summaries';

  /**
   * Save complete blog content to MongoDB
   */
  async saveBlogDocument(
    scrapedContent: ScrapedContent,
    summaryResult: SummaryResult,
    summaryUrdu: string
  ): Promise<DatabaseResult<string>> {
    try {
      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      const document: BlogDocument = {
        title: scrapedContent.title,
        content: scrapedContent.content,
        url: scrapedContent.url,
        scrapedAt: scrapedContent.scrapedAt,
        summary: summaryResult.summary,
        summaryUrdu,
        keyPoints: summaryResult.keyPoints,
        wordCount: summaryResult.wordCount,
        originalLength: summaryResult.originalLength,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(document);

      return {
        success: true,
        data: result.insertedId.toString(),
      };
    } catch (error) {
      console.error('MongoDB save error:', error);
      return {
        success: false,
        error: `Failed to save blog document: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Save summary record to Supabase
   */
  async saveSummaryRecord(
    scrapedContent: ScrapedContent,
    summaryResult: SummaryResult,
    summaryUrdu: string
  ): Promise<DatabaseResult<number>> {
    try {
      const record: Omit<SummaryRecord, 'id'> = {
        title: scrapedContent.title,
        summary: summaryResult.summary,
        summary_urdu: summaryUrdu,
        url: scrapedContent.url,
        word_count: summaryResult.wordCount,
        original_length: summaryResult.originalLength,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.supabaseTable)
        .insert([record])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data.id,
      };
    } catch (error) {
      console.error('Supabase save error:', error);
      return {
        success: false,
        error: `Failed to save summary record: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Save to both databases atomically (best effort)
   */
  async saveToBothDatabases(
    scrapedContent: ScrapedContent,
    summaryResult: SummaryResult,
    summaryUrdu: string
  ): Promise<DatabaseResult<{ mongoId?: string; supabaseId?: number }>> {
    const results: { mongoId?: string; supabaseId?: number } = {};
    const errors: string[] = [];

    // Save to MongoDB
    const mongoResult = await this.saveBlogDocument(scrapedContent, summaryResult, summaryUrdu);
    if (mongoResult.success && mongoResult.data) {
      results.mongoId = mongoResult.data;
    } else if (mongoResult.error) {
      errors.push(`MongoDB: ${mongoResult.error}`);
    }

    // Save to Supabase
    const supabaseResult = await this.saveSummaryRecord(scrapedContent, summaryResult, summaryUrdu);
    if (supabaseResult.success && supabaseResult.data) {
      results.supabaseId = supabaseResult.data;
    } else if (supabaseResult.error) {
      errors.push(`Supabase: ${supabaseResult.error}`);
    }

    const hasAnySuccess = Boolean(results.mongoId || results.supabaseId);

    return {
      success: hasAnySuccess,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  /**
   * Retrieve blog document by ID from MongoDB
   */
  async getBlogDocument(id: string): Promise<DatabaseResult<BlogDocument>> {
    try {
      if (!ObjectId.isValid(id)) {
        return {
          success: false,
          error: 'Invalid ObjectId format',
        };
      }

      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      const document = await collection.findOne({ _id: new ObjectId(id) });

      if (!document) {
        return {
          success: false,
          error: 'Blog document not found',
        };
      }

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      console.error('MongoDB fetch error:', error);
      return {
        success: false,
        error: `Failed to fetch blog document: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Retrieve all blog documents with pagination
   */
  async getAllBlogDocuments(
    page: number = 1,
    limit: number = 10
  ): Promise<DatabaseResult<{ documents: BlogDocument[]; total: number; hasMore: boolean }>> {
    try {
      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        collection
          .find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(),
      ]);

      const hasMore = skip + documents.length < total;

      return {
        success: true,
        data: {
          documents,
          total,
          hasMore,
        },
      };
    } catch (error) {
      console.error('MongoDB fetch all error:', error);
      return {
        success: false,
        error: `Failed to fetch blog documents: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Retrieve all summary records from Supabase
   */
  async getAllSummaryRecords(
    page: number = 1,
    limit: number = 10
  ): Promise<DatabaseResult<{ records: SummaryRecord[]; total: number; hasMore: boolean }>> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const [{ data: records, error: fetchError }, { count: total, error: countError }] = await Promise.all([
        supabase
          .from(this.supabaseTable)
          .select('*')
          .order('created_at', { ascending: false })
          .range(start, end),
        supabase
          .from(this.supabaseTable)
          .select('*', { count: 'exact', head: true }),
      ]);

      if (fetchError) throw new Error(fetchError.message);
      if (countError) throw new Error(countError.message);

      const hasMore = start + (records?.length || 0) < (total || 0);

      return {
        success: true,
        data: {
          records: records || [],
          total: total || 0,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Supabase fetch all error:', error);
      return {
        success: false,
        error: `Failed to fetch summary records: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Search blog documents by title or content
   */
  async searchBlogDocuments(
    query: string,
    limit: number = 10
  ): Promise<DatabaseResult<BlogDocument[]>> {
    try {
      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      // Create text search index if it doesn't exist
      await this.ensureTextIndex();

      const searchResults = await collection
        .find({
          $text: { $search: query },
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .toArray();

      return {
        success: true,
        data: searchResults,
      };
    } catch (error) {
      console.error('MongoDB search error:', error);
      return {
        success: false,
        error: `Failed to search blog documents: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Delete blog document from MongoDB
   */
  async deleteBlogDocument(id: string): Promise<DatabaseResult<boolean>> {
    try {
      if (!ObjectId.isValid(id)) {
        return {
          success: false,
          error: 'Invalid ObjectId format',
        };
      }

      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      return {
        success: result.deletedCount > 0,
        data: result.deletedCount > 0,
        error: result.deletedCount === 0 ? 'Document not found' : undefined,
      };
    } catch (error) {
      console.error('MongoDB delete error:', error);
      return {
        success: false,
        error: `Failed to delete blog document: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Test database connections
   */
  async checkConnectionHealth(): Promise<ConnectionHealth> {
    const health: ConnectionHealth = {
      mongodb: false,
      supabase: false,
      lastChecked: new Date(),
    };

    // Test MongoDB
    try {
      const client = await clientPromise;
      await client.db(this.mongoDbName).admin().ping();
      health.mongodb = true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }

    // Test Supabase
    try {
      const { error } = await supabase
        .from(this.supabaseTable)
        .select('id')
        .limit(1);

      health.supabase = !error;
    } catch (error) {
      console.error('Supabase health check failed:', error);
    }

    return health;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseResult<{
    mongo: { totalDocuments: number; totalSize: number };
    supabase: { totalRecords: number };
  }>> {
    try {
      const [mongoStats, supabaseStats] = await Promise.all([
        this.getMongoStats(),
        this.getSupabaseStats(),
      ]);

      return {
        success: true,
        data: {
          mongo: mongoStats,
          supabase: supabaseStats,
        },
      };
    } catch (error) {
      console.error('Database stats error:', error);
      return {
        success: false,
        error: `Failed to get database statistics: ${this.getErrorMessage(error)}`,
      };
    }
  }

  /**
   * Ensure text search index exists for MongoDB
   */
  private async ensureTextIndex(): Promise<void> {
    try {
      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      await collection.createIndex(
        { title: 'text', content: 'text', summary: 'text' },
        { name: 'blog_text_search' }
      );
    } catch (error) {
      // Index might already exist, which is fine
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('already exists')) {
        console.warn('Failed to create text index:', error);
      }
    }
  }

  /**
   * Get MongoDB collection statistics
   */
  private async getMongoStats(): Promise<{ totalDocuments: number; totalSize: number }> {
    try {
      const client = await clientPromise;
      const db = client.db(this.mongoDbName);
      const collection = db.collection<BlogDocument>(this.mongoCollection);

      const [totalDocuments, stats] = await Promise.all([
        collection.countDocuments(),
        db.command({ collStats: this.mongoCollection })
      ]);

      return {
        totalDocuments,
        totalSize: stats.size || 0,
      };
    } catch (error) {
      return { totalDocuments: 0, totalSize: 0 };
    }
  }

  /**
   * Get Supabase table statistics
   */
  private async getSupabaseStats(): Promise<{ totalRecords: number }> {
    try {
      const { count, error } = await supabase
        .from(this.supabaseTable)
        .select('*', { count: 'exact', head: true });

      return { totalRecords: error ? 0 : count || 0 };
    } catch (error) {
      return { totalRecords: 0 };
    }
  }

  /**
   * Extract error message from unknown error type
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

export const databaseService = new DatabaseService();
