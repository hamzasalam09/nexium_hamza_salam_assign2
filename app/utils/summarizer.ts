import { CohereClient } from 'cohere-ai';

if (!process.env.NEXT_PUBLIC_COHERE_API_KEY) {
  throw new Error('NEXT_PUBLIC_COHERE_API_KEY is not set in environment variables');
}

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.NEXT_PUBLIC_COHERE_API_KEY
});

export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await cohere.summarize({
      text,
      length: 'medium',
      format: 'paragraph',
      extractiveness: 'medium',
      temperature: 0.3,
    });

    if (!response.summary) {
      throw new Error('No summary was generated');
    }
    return response.summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function translateToUrdu(text: string): Promise<string> {
  try {
    const response = await cohere.generate({
      prompt: `Translate the following English text to Urdu:\n\n${text}\n\nUrdu translation:`,
      maxTokens: 500,
      temperature: 0.3,
      k: 0,
      stopSequences: [],
      returnLikelihoods: 'NONE'
    });

    return response.generations[0].text.trim();
  } catch (error) {
    console.error('Error translating to Urdu:', error);
    throw new Error('Failed to translate to Urdu');
  }
}
