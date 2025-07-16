import { CohereClient } from 'cohere-ai';
import { 
  containsUrduScript, 
  normalizeUrduText, 
  extractUrduText, 
  validateUrduTranslation,
  postProcessUrduTranslation 
} from './urdu-utils';

// Initialize Cohere client with proper error handling
let cohereClient: CohereClient | null = null;

try {
  if (process.env.COHERE_API_KEY) {
    cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
  } else {
    console.warn('COHERE_API_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Cohere client:', error);
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  originalLength: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  language: string;
  confidence?: number;
}

export interface CombinedResult {
  summary: SummaryResult;
  translation: TranslationResult;
}

export class CohereService {
  private readonly client = cohereClient;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Check if Cohere API is available and properly configured
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate AI-powered summary using Cohere
   */
  public async generateSummary(content: string): Promise<SummaryResult> {
    if (!this.isAvailable()) {
      throw new Error('Cohere API is not available. Please check your API key.');
    }

    const prompt = this.createSummaryPrompt(content);

    try {
      const response = await this.client!.chat({
        model: 'command-r-plus',
        message: prompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      const responseText = response.text || '';
      const parsedResult = this.parseSummaryResponse(responseText);

      return {
        summary: parsedResult.summary,
        keyPoints: parsedResult.keyPoints,
        wordCount: this.countWords(content),
        originalLength: content.length,
      };
    } catch (error) {
      console.error('Cohere summarization error:', error);
      return this.generateFallbackSummary(content);
    }
  }

  /**
   * Translate text to Urdu using Cohere
   */
  public async translateToUrdu(text: string): Promise<TranslationResult> {
    if (!this.isAvailable()) {
      throw new Error('Cohere API is not available. Please check your API key.');
    }

    const prompt = this.createTranslationPrompt(text);

    try {
      const response = await this.client!.v2.chat({
        model: 'command-r-plus',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        maxTokens: 500,
      });

      const responseText = response.message?.content?.[0]?.text || '';
      let translatedText = this.cleanTranslationResponse(responseText);

      // Validate and post-process the translation
      const validation = validateUrduTranslation(text, translatedText);
      
      if (!validation.isValid) {
        console.warn('Translation quality issues:', validation.issues);
        if (validation.issues.includes('Translation does not contain Urdu script')) {
          translatedText = this.generateFallbackTranslation(text);
        }
      }

      return {
        originalText: text,
        translatedText: postProcessUrduTranslation(translatedText),
        language: 'urdu',
      };
    } catch (error) {
      console.error('Cohere translation error:', error);
      return {
        originalText: text,
        translatedText: this.generateFallbackTranslation(text),
        language: 'urdu',
      };
    }
  }

  /**
   * Translate text with retry mechanism for better reliability
   */
  public async translateWithRetry(text: string): Promise<TranslationResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.translateToUrdu(text);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Translation attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    console.error('All translation attempts failed, using fallback. Last error:', lastError?.message);
    return {
      originalText: text,
      translatedText: this.generateFallbackTranslation(text),
      language: 'urdu',
    };
  }

  /**
   * Generate both summary and translation efficiently
   */
  public async generateSummaryAndTranslation(content: string): Promise<CombinedResult> {
    if (!this.isAvailable()) {
      throw new Error('Cohere API is not available. Please check your API key.');
    }

    const prompt = this.createCombinedPrompt(content);

    try {
      const response = await this.client!.v2.chat({
        model: 'command-r-plus',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 1500,
      });

      const responseText = response.message?.content?.[0]?.text || '';
      const parsed = this.parseCombinedResponse(responseText);

      const summary: SummaryResult = {
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        wordCount: this.countWords(content),
        originalLength: content.length,
      };

      let urduTranslation = parsed.summaryUrdu;
      const validation = validateUrduTranslation(parsed.summary, urduTranslation);
      
      if (!validation.isValid) {
        console.warn('Combined translation quality issues:', validation.issues);
        urduTranslation = this.generateFallbackTranslation(parsed.summary);
      }

      const translation: TranslationResult = {
        originalText: parsed.summary,
        translatedText: postProcessUrduTranslation(urduTranslation),
        language: 'urdu',
      };

      return { summary, translation };
    } catch (error) {
      console.error('Cohere combined generation error:', error);
      // Fallback to separate calls
      const summary = await this.generateSummary(content);
      const translation = await this.translateToUrdu(summary.summary);
      return { summary, translation };
    }
  }

  /**
   * Create optimized prompt for summarization
   */
  private createSummaryPrompt(content: string): string {
    return `Please analyze the following blog content and provide a structured summary.

Requirements:
1. Create a concise summary (3-5 sentences) that captures the main message
2. Extract 3-5 key points as bullet points
3. Focus on the most important information and insights
4. Maintain clarity and readability

Content to analyze:
${content}

Please format your response exactly as follows:
SUMMARY: [Your 3-5 sentence summary here]

KEY POINTS:
- [First key point]
- [Second key point]
- [Third key point]
- [Additional points if relevant]`;
  }

  /**
   * Create optimized prompt for translation
   */
  private createTranslationPrompt(text: string): string {
    return `Translate the following English text to natural, fluent Urdu.

Requirements:
- Provide only the Urdu translation (no explanations)
- Use proper Urdu vocabulary and grammar
- Maintain the original meaning and tone
- Use correct Urdu script (Arabic script)
- Make it sound natural to native Urdu speakers

English text:
${text}

Urdu translation:`;
  }

  /**
   * Create combined prompt for both summary and translation
   */
  private createCombinedPrompt(content: string): string {
    return `Analyze the following blog content and provide both an English summary and its Urdu translation.

Requirements:
1. Create a concise English summary (3-5 sentences)
2. Extract 3-5 key points
3. Provide a natural Urdu translation of the summary
4. Ensure the Urdu translation is fluent and grammatically correct

Content:
${content}

Format your response exactly as follows:
SUMMARY: [Your English summary here]

KEY POINTS:
- [First key point]
- [Second key point]
- [Third key point]

URDU TRANSLATION: [اردو ترجمہ یہاں لکھیں]`;
  }

  /**
   * Parse summary response from Cohere
   */
  private parseSummaryResponse(response: string): { summary: string; keyPoints: string[] } {
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=KEY POINTS:|$)/);
    const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]*?)$/);

    const summary = summaryMatch?.[1]?.trim() || 'Unable to generate summary';
    
    const keyPointsText = keyPointsMatch?.[1]?.trim() || '';
    const keyPoints = keyPointsText
      .split('\n')
      .map(point => point.replace(/^[-*•]\s*/, '').trim())
      .filter(point => point.length > 0)
      .slice(0, 5);

    return { summary, keyPoints };
  }

  /**
   * Parse combined response from Cohere
   */
  private parseCombinedResponse(response: string): { 
    summary: string; 
    keyPoints: string[]; 
    summaryUrdu: string; 
  } {
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=KEY POINTS:|$)/);
    const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]*?)(?=URDU TRANSLATION:|$)/);
    const urduMatch = response.match(/URDU TRANSLATION:\s*([\s\S]*?)$/);

    const summary = summaryMatch?.[1]?.trim() || 'Unable to generate summary';
    
    const keyPointsText = keyPointsMatch?.[1]?.trim() || '';
    const keyPoints = keyPointsText
      .split('\n')
      .map(point => point.replace(/^[-*•]\s*/, '').trim())
      .filter(point => point.length > 0)
      .slice(0, 5);

    const summaryUrdu = urduMatch?.[1]?.trim() || this.generateFallbackTranslation(summary);

    return { summary, keyPoints, summaryUrdu };
  }

  /**
   * Clean translation response to remove unwanted text
   */
  private cleanTranslationResponse(response: string): string {
    let cleaned = extractUrduText(response);
    
    if (!containsUrduScript(cleaned)) {
      cleaned = normalizeUrduText(response);
    }
    
    return cleaned || response;
  }

  /**
   * Generate fallback summary using extractive method
   */
  private generateFallbackSummary(content: string): SummaryResult {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 5);

    return {
      summary: sentences.join('. ') + '.',
      keyPoints: sentences.slice(0, 3),
      wordCount: this.countWords(content),
      originalLength: content.length,
    };
  }

  /**
   * Generate fallback translation using basic dictionary
   */
  private generateFallbackTranslation(text: string): string {
    const basicDict: Record<string, string> = {
      'the': 'یہ', 'and': 'اور', 'is': 'ہے', 'in': 'میں', 'to': 'کو',
      'of': 'کا', 'a': 'ایک', 'that': 'یہ', 'it': 'یہ', 'with': 'کے ساتھ',
      'for': 'کے لیے', 'as': 'جیسے', 'was': 'تھا', 'on': 'پر', 'are': 'ہیں',
      'you': 'آپ', 'this': 'یہ', 'be': 'ہونا', 'at': 'پر', 'by': 'کے ذریعے',
      'not': 'نہیں', 'or': 'یا', 'have': 'ہے', 'from': 'سے', 'they': 'وہ',
      'we': 'ہم', 'but': 'لیکن', 'blog': 'بلاگ', 'content': 'مواد',
      'summary': 'خلاصہ', 'information': 'معلومات', 'technology': 'ٹیکنالوجی'
    };
    
    return text
      .toLowerCase()
      .split(/\s+/)
      .map(word => {
        const cleanWord = word.replace(/[.,!?;:()[\]{}'"]/g, '');
        return basicDict[cleanWord] || word;
      })
      .join(' ');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Delay execution for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cohereService = new CohereService(); 