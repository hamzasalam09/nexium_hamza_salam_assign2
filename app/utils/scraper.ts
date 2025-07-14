import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeBlogContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove unnecessary elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    
    // Extract main content (customize selectors based on target blogs)
    const content = $('article, .content, .post-content, main')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ');
      
    return content;
  } catch (error) {
    console.error('Error scraping blog:', error);
    throw new Error('Failed to scrape blog content');
  }
}
