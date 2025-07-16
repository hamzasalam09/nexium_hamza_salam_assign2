/**
 * Comprehensive Urdu text processing and validation utilities
 */

// Unicode ranges for Urdu/Arabic script
const URDU_UNICODE_RANGES = [
  { start: 0x0600, end: 0x06FF }, // Arabic
  { start: 0x0750, end: 0x077F }, // Arabic Supplement
  { start: 0x08A0, end: 0x08FF }, // Arabic Extended-A
  { start: 0xFB50, end: 0xFDFF }, // Arabic Presentation Forms-A
  { start: 0xFE70, end: 0xFEFF }, // Arabic Presentation Forms-B
];

// Common Urdu diacritics and marks
const URDU_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

// Urdu punctuation marks
const URDU_PUNCTUATION = {
  FULL_STOP: '۔',
  QUESTION_MARK: '؟',
  EXCLAMATION: '!',
  COMMA: '،',
  SEMICOLON: '؛',
  COLON: ':',
};

// Common Urdu phrases and expressions
export const URDU_PHRASES = {
  // Content structure
  SUMMARY: 'خلاصہ',
  KEY_POINTS: 'اہم نکات',
  INTRODUCTION: 'تعارف',
  CONCLUSION: 'خلاصہ کلام',
  DETAILS: 'تفصیلات',
  EXAMPLE: 'مثال',
  NOTE: 'نوٹ',
  
  // Analysis terms
  ANALYSIS: 'تجزیہ',
  COMPARISON: 'موازنہ',
  EVALUATION: 'جائزہ',
  RESEARCH: 'تحقیق',
  STUDY: 'مطالعہ',
  FINDINGS: 'نتائج',
  
  // Technology terms
  TECHNOLOGY: 'ٹیکنالوجی',
  DIGITAL: 'ڈیجیٹل',
  ARTIFICIAL_INTELLIGENCE: 'مصنوعی ذہانت',
  MACHINE_LEARNING: 'مشین لرننگ',
  DATA: 'ڈیٹا',
  SOFTWARE: 'سافٹ ویئر',
  APPLICATION: 'ایپلیکیشن',
  
  // Academic terms
  EDUCATION: 'تعلیم',
  KNOWLEDGE: 'علم',
  INFORMATION: 'معلومات',
  METHOD: 'طریقہ کار',
  PROCESS: 'عمل',
  DEVELOPMENT: 'ترقی',
  
  // Business terms
  BUSINESS: 'کاروبار',
  MANAGEMENT: 'انتظام',
  STRATEGY: 'حکمت عملی',
  PROJECT: 'منصوبہ',
  SOLUTION: 'حل',
  SUCCESS: 'کامیابی',
} as const;

// Translation quality metrics
export interface UrduQualityMetrics {
  hasUrduScript: boolean;
  scriptPercentage: number;
  diacriticsCount: number;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
}

// Translation validation result
export interface UrduValidationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
  metrics: UrduQualityMetrics;
}

/**
 * Check if text contains Urdu/Arabic script characters
 */
export function containsUrduScript(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  return URDU_UNICODE_RANGES.some(range => {
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode >= range.start && charCode <= range.end) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Calculate percentage of Urdu script characters in text
 */
export function calculateUrduScriptPercentage(text: string): number {
  if (!text || text.length === 0) return 0;
  
  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return 0;
  
  let urduChars = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (URDU_UNICODE_RANGES.some(range => charCode >= range.start && charCode <= range.end)) {
      urduChars++;
    }
  }
  
  return (urduChars / totalChars) * 100;
}

/**
 * Clean and normalize Urdu text
 */
export function normalizeUrduText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')                           // Normalize whitespace
    .replace(/^\s*["""]|["""]\s*$/g, '')           // Remove surrounding quotes
    .replace(/^(اردو ترجمہ:|ترجمہ:|یہ اردو ترجمہ ہے:|Translation:|Urdu:)/gi, '') // Remove prefixes
    .replace(/\r\n/g, '\n')                        // Normalize line endings
    .replace(/\n+/g, '\n')                         // Remove multiple newlines
    .trim();
}

/**
 * Extract Urdu text from mixed-language content
 */
export function extractUrduText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const lines = text.split(/\n+/);
  const urduLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && containsUrduScript(trimmedLine)) {
      // Check if the line has sufficient Urdu content (>30%)
      const urduPercentage = calculateUrduScriptPercentage(trimmedLine);
      if (urduPercentage > 30) {
        urduLines.push(normalizeUrduText(trimmedLine));
      }
    }
  }
  
  return urduLines.length > 0 ? urduLines.join('\n') : normalizeUrduText(text);
}

/**
 * Get comprehensive metrics for Urdu text quality
 */
export function analyzeUrduTextQuality(text: string): UrduQualityMetrics {
  const cleanText = normalizeUrduText(text);
  const hasUrduScript = containsUrduScript(cleanText);
  const scriptPercentage = calculateUrduScriptPercentage(cleanText);
  
  // Count diacritics
  const diacriticsMatches = cleanText.match(URDU_DIACRITICS);
  const diacriticsCount = diacriticsMatches ? diacriticsMatches.length : 0;
  
  // Count words and sentences
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  const sentences = cleanText.split(/[۔؟!.!?]+/).filter(s => s.trim().length > 5);
  const sentenceCount = sentences.length;
  
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Quality assessment
  const issues: string[] = [];
  const suggestions: string[] = [];
  let qualityScore = 1.0;
  
  // Script validation
  if (!hasUrduScript) {
    issues.push('No Urdu script detected');
    qualityScore -= 0.5;
    suggestions.push('Ensure text contains Urdu characters');
  } else if (scriptPercentage < 50) {
    issues.push(`Low Urdu script percentage (${scriptPercentage.toFixed(1)}%)`);
    qualityScore -= 0.2;
    suggestions.push('Remove non-Urdu text or improve translation');
  }
  
  // Length validation
  if (wordCount < 3) {
    issues.push('Text too short');
    qualityScore -= 0.3;
  } else if (wordCount > 1000) {
    issues.push('Text might be too long');
    qualityScore -= 0.1;
    suggestions.push('Consider breaking into smaller segments');
  }
  
  // Structure validation
  if (sentenceCount === 0) {
    issues.push('No proper sentences detected');
    qualityScore -= 0.2;
    suggestions.push('Add proper punctuation (۔ ؟ !)');
  } else if (avgWordsPerSentence > 25) {
    issues.push('Sentences too long');
    qualityScore -= 0.1;
    suggestions.push('Break long sentences for better readability');
  }
  
  // English words detection
  const englishWordPattern = /[a-zA-Z]{3,}/g;
  const englishWords = cleanText.match(englishWordPattern);
  if (englishWords && englishWords.length > wordCount * 0.3) {
    issues.push('Too many English words detected');
    qualityScore -= 0.2;
    suggestions.push('Translate English terms to Urdu equivalents');
  }
  
  return {
    hasUrduScript,
    scriptPercentage,
    diacriticsCount,
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    qualityScore: Math.max(0, qualityScore),
    issues,
    suggestions,
  };
}

/**
 * Validate Urdu translation quality against original text
 */
export function validateUrduTranslation(
  originalText: string, 
  translatedText: string,
  minQualityScore: number = 0.5
): UrduValidationResult {
  const metrics = analyzeUrduTextQuality(translatedText);
  const issues: string[] = [...metrics.issues];
  const suggestions: string[] = [...metrics.suggestions];
  
  // Length comparison
  const originalWords = originalText.split(/\s+/).filter(w => w.length > 0).length;
  const translatedWords = metrics.wordCount;
  
  if (translatedWords < originalWords * 0.3) {
    issues.push('Translation significantly shorter than original');
    suggestions.push('Ensure complete translation of all content');
  } else if (translatedWords > originalWords * 3) {
    issues.push('Translation much longer than original');
    suggestions.push('Check for repetitive or redundant content');
  }
  
  // Calculate confidence based on quality metrics
  let confidence = metrics.qualityScore;
  
  if (metrics.scriptPercentage > 80) confidence += 0.1;
  if (metrics.sentenceCount > 0 && metrics.avgWordsPerSentence < 20) confidence += 0.1;
  if (metrics.diacriticsCount > 0) confidence += 0.05;
  
  confidence = Math.min(1.0, confidence);
  
  const isValid = metrics.qualityScore >= minQualityScore && metrics.hasUrduScript;
  
  return {
    isValid,
    confidence,
    issues,
    suggestions,
    metrics,
  };
}

/**
 * Post-process and enhance Urdu translation
 */
export function postProcessUrduTranslation(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let processed = normalizeUrduText(text);
  
  // Fix common spacing issues
  processed = processed
    .replace(/([آ-ی])\s+([آ-ی])/g, '$1$2')        // Remove spaces between Urdu letters
    .replace(/\s*([۔؟!،؛])\s*/g, '$1 ')           // Fix punctuation spacing
    .replace(/([۔؟!])\s*([^\s])/g, '$1 $2')       // Ensure space after sentence endings
    .replace(/\s+/g, ' ')                          // Final whitespace cleanup
    .trim();
  
  // Ensure proper sentence endings
  if (processed && !processed.match(/[۔؟!]$/)) {
    processed += '۔';
  }
  
  return processed;
}

/**
 * Convert English punctuation to Urdu equivalents
 */
export function convertPunctuationToUrdu(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/\./g, URDU_PUNCTUATION.FULL_STOP)
    .replace(/\?/g, URDU_PUNCTUATION.QUESTION_MARK)
    .replace(/,/g, URDU_PUNCTUATION.COMMA)
    .replace(/;/g, URDU_PUNCTUATION.SEMICOLON);
}

/**
 * Check if text direction should be RTL (Right-to-Left)
 */
export function isRtlText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return calculateUrduScriptPercentage(text) > 30;
}

/**
 * Get word count for Urdu text (handles RTL properly)
 */
export function getUrduWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  const cleaned = normalizeUrduText(text);
  const words = cleaned.split(/\s+/).filter(word => word.trim().length > 0);
  
  return words.length;
}

/**
 * Split Urdu text into sentences
 */
export function splitUrduSentences(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  
  const normalized = normalizeUrduText(text);
  const sentences = normalized
    .split(/[۔؟!]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

/**
 * Generate text statistics for Urdu content
 */
export function getUrduTextStatistics(text: string): {
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  urduCharacterCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  scriptPercentage: number;
  hasProperPunctuation: boolean;
} {
  const metrics = analyzeUrduTextQuality(text);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const hasProperPunctuation = /[۔؟!]/.test(text);
  
  return {
    wordCount: metrics.wordCount,
    sentenceCount: metrics.sentenceCount,
    characterCount: text.length,
    urduCharacterCount: Math.round((text.length * metrics.scriptPercentage) / 100),
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: metrics.avgWordsPerSentence,
    scriptPercentage: metrics.scriptPercentage,
    hasProperPunctuation,
  };
}
