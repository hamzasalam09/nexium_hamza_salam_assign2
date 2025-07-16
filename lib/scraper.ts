import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  scrapedAt: Date;
  metadata?: {
    description?: string;
    author?: string;
    publishDate?: string;
    wordCount: number;
    contentQuality: ContentQuality;
  };
}

export interface ContentQuality {
  score: number; // 0-1
  issues: string[];
  suggestions: string[];
}

export interface ScrapingConfig {
  timeout: number;
  maxRetries: number;
  userAgent: string;
  validateContent: boolean;
  minContentLength: number;
}

export class WebScraper {
  private readonly defaultConfig: ScrapingConfig = {
    timeout: 15000,
    maxRetries: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    validateContent: true,
    minContentLength: 100,
  };

  private readonly contentSelectors = [
    'article',
    '.post-content',
    '.entry-content',
    '.content',
    '.post-body',
    '.article-content',
    '.article-body',
    '.blog-content',
    '.main-content',
    '.content-area',
    'main[role="main"]',
    'main',
    '[role="main"]',
    '.container .content',
    '#content',
    '#main',
  ];

  private readonly titleSelectors = [
    'h1.entry-title',
    'h1.post-title',
    'h1.article-title',
    '.title h1',
    'header h1',
    'h1',
    'title',
  ];

  /**
   * Scrape content from a blog URL
   */
  async scrapeContent(url: string, config?: Partial<ScrapingConfig>): Promise<ScrapedContent> {
    const scrapeConfig = { ...this.defaultConfig, ...config };

    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= scrapeConfig.maxRetries; attempt++) {
      try {
        return await this.attemptScrape(url, scrapeConfig);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Scraping attempt ${attempt} failed for ${url}:`, error);

        if (attempt < scrapeConfig.maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to scrape content after ${scrapeConfig.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Scrape multiple URLs concurrently
   */
  async scrapeMultiple(urls: string[], config?: Partial<ScrapingConfig>): Promise<Array<ScrapedContent | Error>> {
    const results = await Promise.allSettled(
      urls.map(url => this.scrapeContent(url, config))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Failed to scrape URL ${urls[index]}:`, result.reason);
        return new Error(result.reason);
      }
    });
  }

  /**
   * Validate if the scraped content meets quality standards
   */
  validateContent(content: string, minLength: number = 100): ContentQuality {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    // Check content length
    if (content.length < minLength) {
      issues.push(`Content too short (${content.length} chars, minimum ${minLength})`);
      score -= 0.3;
    }

    // Check for meaningful content
    const wordCount = this.countWords(content);
    if (wordCount < 50) {
      issues.push(`Very few words (${wordCount})`);
      score -= 0.2;
    }

    // Check for repetitive content
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    const repetitionRatio = uniqueWords / wordCount;
    if (repetitionRatio < 0.3) {
      issues.push('Content appears repetitive');
      score -= 0.2;
      suggestions.push('Try a different content selector');
    }

    // Check for navigation/menu text
    const navigationIndicators = ['menu', 'navigation', 'breadcrumb', 'sidebar', 'footer', 'header'];
    const hasNavigationText = navigationIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    if (hasNavigationText) {
      issues.push('Content may include navigation elements');
      score -= 0.1;
    }

    // Check content structure
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
    if (sentenceCount < 3) {
      issues.push('Content lacks proper sentence structure');
      score -= 0.2;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Extract metadata from the webpage
   */
  private extractMetadata($: cheerio.CheerioAPI, content: string): ScrapedContent['metadata'] {
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    const author = $('meta[name="author"]').attr('content') ||
                   $('meta[property="article:author"]').attr('content') ||
                   $('.author').first().text().trim() ||
                   $('[rel="author"]').first().text().trim() ||
                   '';

    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                        $('meta[name="date"]').attr('content') ||
                        $('time[datetime]').attr('datetime') ||
                        $('.date').first().text().trim() ||
                        '';

    const wordCount = this.countWords(content);
    const contentQuality = this.validateContent(content);

    return {
      description: description || undefined,
      author: author || undefined,
      publishDate: publishDate || undefined,
      wordCount,
      contentQuality,
    };
  }

  /**
   * Attempt to scrape content from URL
   */
  private async attemptScrape(url: string, config: ScrapingConfig): Promise<ScrapedContent> {
    const requestConfig: AxiosRequestConfig = {
      timeout: config.timeout,
      headers: {
        'User-Agent': config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    };

    const response = await axios.get(url, requestConfig);
    const $ = cheerio.load(response.data);

    // Extract title
    const title = this.extractTitle($);
    
    // Extract main content
    const content = this.extractContent($);

    // Validate content if required
    if (config.validateContent) {
      const quality = this.validateContent(content, config.minContentLength);
      if (quality.score < 0.3) {
        throw new Error(`Poor content quality (score: ${quality.score}): ${quality.issues.join(', ')}`);
      }
    }

    // Extract metadata
    const metadata = this.extractMetadata($, content);

    return {
      title,
      content,
      url,
      scrapedAt: new Date(),
      metadata,
    };
  }

  /**
   * Extract title using multiple strategies
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    for (const selector of this.titleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const title = element.first().text().trim();
        if (title && title.length > 0 && title.length < 200) {
          return this.cleanText(title);
        }
      }
    }

    // Fallback to page title
    const pageTitle = $('title').text().trim();
    if (pageTitle) {
      return this.cleanText(pageTitle);
    }

    return 'Untitled Article';
  }

  /**
   * Extract main content using multiple strategies
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Strategy 1: Try specific content selectors
    for (const selector of this.contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const content = this.extractTextFromElement($, element.first());
        if (content.length > 100) {
          return content;
        }
      }
    }

    // Strategy 2: Find the largest text block
    const textBlocks = this.findLargestTextBlocks($);
    if (textBlocks.length > 0) {
      return textBlocks[0];
    }

    // Strategy 3: Extract all paragraphs
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20);
    if (paragraphs.length > 0) {
      return paragraphs.join('\n\n');
    }

    throw new Error('Could not extract sufficient content from the webpage');
  }

  /**
   * Extract and clean text from a specific element
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTextFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
    // Remove unwanted elements
    element.find('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .breadcrumb, .social-share, .comments').remove();
    
    // Get text content
    const text = element.text().trim();
    
    // Clean and normalize the text
    return this.cleanText(text);
  }

  /**
   * Find the largest text blocks on the page
   */
  private findLargestTextBlocks($: cheerio.CheerioAPI): string[] {
    const textBlocks: Array<{ text: string; length: number }> = [];

    $('div, section, article').each((_, element) => {
      const $element = $(element);
      
      // Skip navigation and other non-content elements
      if ($element.closest('nav, header, footer, aside, .sidebar, .menu').length > 0) {
        return;
      }

      const text = this.extractTextFromElement($, $element);
      if (text.length > 100) {
        textBlocks.push({ text, length: text.length });
      }
    });

    return textBlocks
      .sort((a, b) => b.length - a.length)
      .slice(0, 3)
      .map(block => block.text);
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')                    // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n')                   // Replace multiple newlines with single newline
      .replace(/\t+/g, ' ')                    // Replace tabs with spaces
      .replace(/[^\x20-\x7E\n]/g, '')          // Remove non-printable characters except newlines
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Delay execution for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export default scraper instance
export const webScraper = new WebScraper();

// Export convenience function for backward compatibility
export async function scrapeBlogContent(url: string): Promise<ScrapedContent> {
  return webScraper.scrapeContent(url);
}
