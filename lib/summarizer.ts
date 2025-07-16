import { cohereService, SummaryResult } from './cohere';

/**
 * Generate comprehensive summary of blog content using AI
 */
export async function generateSummary(content: string): Promise<SummaryResult> {
  if (!content?.trim()) {
    throw new Error('Content is required for summarization');
  }

  try {
    return await cohereService.generateSummary(content);
  } catch (error) {
    console.warn('AI summarization failed, falling back to extractive method:', error);
    return generateExtractiveSummary(content);
  }
}

/**
 * Generate summary using extractive technique (fallback method)
 */
export function generateExtractiveSummary(content: string): SummaryResult {
  if (!content?.trim()) {
    throw new Error('Content is required for summarization');
  }

  const cleanContent = preprocessContent(content);
  const sentences = extractSentences(cleanContent);
  const scoredSentences = scoreSentences(sentences);
  
  // Select top sentences for summary
  const selectedSentences = selectTopSentences(scoredSentences, sentences.length);
  const summary = selectedSentences.map(item => item.sentence).join('. ') + '.';
  
  // Extract key points using different strategy
  const keyPoints = extractKeyPoints(content, sentences);

  return {
    summary: summary || 'Unable to generate summary from provided content.',
    keyPoints,
    wordCount: countWords(cleanContent),
    originalLength: cleanContent.length,
  };
}

/**
 * Preprocess content for better analysis
 */
function preprocessContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()[\]{}'"]/g, '')
    .trim();
}

/**
 * Extract and filter sentences from content
 */
function extractSentences(content: string): string[] {
  return content
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 15 && sentence.split(/\s+/).length >= 3);
}

/**
 * Score sentences based on importance indicators
 */
function scoreSentences(sentences: string[]): Array<{ sentence: string; score: number; index: number }> {
  const importantTerms = new Set([
    'important', 'significant', 'key', 'main', 'primary', 'essential', 'crucial',
    'major', 'fundamental', 'critical', 'vital', 'necessary', 'therefore',
    'however', 'moreover', 'furthermore', 'consequently', 'result', 'conclusion',
    'summary', 'findings', 'discovered', 'research', 'study', 'analysis',
    'data', 'evidence', 'shows', 'reveals', 'indicates', 'suggests',
    'demonstrates', 'proves', 'according', 'expert', 'study', 'report'
  ]);

  return sentences.map((sentence, index) => {
    let score = 0;
    const words = sentence.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    // Position scoring (beginning and end are often important)
    if (index < sentences.length * 0.2) score += 3;
    if (index > sentences.length * 0.8) score += 2;

    // Length scoring (prefer moderate length sentences)
    if (wordCount >= 10 && wordCount <= 30) score += 2;
    else if (wordCount >= 8 && wordCount <= 35) score += 1;

    // Important terms scoring
    const lowerSentence = sentence.toLowerCase();
    importantTerms.forEach(term => {
      if (lowerSentence.includes(term)) score += 1;
    });

    // Penalize sentences with too many numbers or special characters
    const numberMatches = sentence.match(/\d+/g)?.length || 0;
    const specialCharMatches = sentence.match(/[()[\]{}]/g)?.length || 0;
    
    if (numberMatches > 3) score -= 1;
    if (specialCharMatches > 2) score -= 1;

    // Bonus for sentences with multiple important terms
    const importantTermCount = Array.from(importantTerms)
      .filter(term => lowerSentence.includes(term)).length;
    if (importantTermCount >= 2) score += 1;

    return { sentence, score, index };
  });
}

/**
 * Select top sentences while maintaining original order
 */
function selectTopSentences(
  scoredSentences: Array<{ sentence: string; score: number; index: number }>,
  totalSentences: number
): Array<{ sentence: string; score: number; index: number }> {
  const maxSentences = Math.min(5, Math.ceil(totalSentences * 0.3));
  
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);
}

/**
 * Extract key points from content using multiple strategies
 */
function extractKeyPoints(content: string, sentences: string[]): string[] {
  const keyPoints: string[] = [];
  
  // Strategy 1: Look for existing bullet points or numbered lists
  const bulletPoints = extractBulletPoints(content);
  keyPoints.push(...bulletPoints);
  
  // Strategy 2: Find sentences with key indicators
  if (keyPoints.length < 3) {
    const keywordSentences = findKeywordSentences(sentences);
    keyPoints.push(...keywordSentences);
  }
  
  // Strategy 3: Use top-scored sentences as fallback
  if (keyPoints.length === 0) {
    const topSentences = sentences.slice(0, 3);
    keyPoints.push(...topSentences);
  }
  
  return keyPoints
    .filter(point => point.length > 10 && point.length < 200)
    .slice(0, 5);
}

/**
 * Extract existing bullet points from content
 */
function extractBulletPoints(content: string): string[] {
  const points: string[] = [];
  const patterns = [
    /[•·\-\*]\s*([^•·\-\*\n]{10,150})/g,
    /\d+[\.\)]\s*([^\d\n]{10,150})/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const point = match[1].trim();
      if (point.length >= 10) {
        points.push(point);
      }
    }
  });
  
  return points;
}

/**
 * Find sentences containing key indicators
 */
function findKeywordSentences(sentences: string[]): string[] {
  const keyIndicators = [
    'key', 'important', 'main', 'significant', 'essential', 'crucial',
    'primary', 'major', 'fundamental', 'critical'
  ];
  
  return sentences
    .filter(sentence => {
      const lower = sentence.toLowerCase();
      return keyIndicators.some(indicator => lower.includes(indicator));
    })
    .slice(0, 3);
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
