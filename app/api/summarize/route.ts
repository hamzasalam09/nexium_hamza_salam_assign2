import { NextRequest, NextResponse } from 'next/server'
import { scrapeBlogContent } from '@/lib/scraper'
import { generateSummary } from '@/lib/summarizer'
import { translateToUrdu } from '@/lib/translator'
import { databaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Step 1: Scrape the blog content
    console.log('Scraping content from:', url)
    const scrapedContent = await scrapeBlogContent(url)

    // Generate summary using Cohere AI
    console.log('Generating summary with Cohere AI...')
    const summaryResult = await generateSummary(scrapedContent.content)

    // Translate to Urdu using Cohere AI
    console.log('Translating to Urdu with Cohere AI...')
    const summaryUrdu = await translateToUrdu(summaryResult.summary)

    // Step 4: Save to databases
    console.log('Saving to databases...')
    const saveResult = await databaseService.saveToBothDatabases(
      scrapedContent,
      summaryResult,
      summaryUrdu
    )

    // Return the results
    return NextResponse.json({
      success: true,
      data: {
        title: scrapedContent.title,
        url: scrapedContent.url,
        summary: summaryResult.summary,
        summaryUrdu,
        keyPoints: summaryResult.keyPoints,
        wordCount: summaryResult.wordCount,
        originalLength: summaryResult.originalLength,
        mongoId: saveResult.data?.mongoId,
        supabaseId: saveResult.data?.supabaseId,
        scrapedAt: scrapedContent.scrapedAt,
        aiPowered: true
      }
    })

  } catch (error) {
    console.error('Error in summarize API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Failed to process blog post',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all summaries from Supabase
    const result = await databaseService.getAllSummaryRecords()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch summaries')
    }
    
    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error fetching summaries:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch summaries',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
