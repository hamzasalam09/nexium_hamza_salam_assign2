import { cohere } from 'cohere-ai';

// Initialize Cohere client
cohere.init(process.env.COHERE_API_KEY as string);

export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await cohere.summarize({
      text,
      length: 'medium',
      format: 'paragraph',
      extractiveness: 'medium',
      temperature: 0.3,
    });

    return response.body.summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function translateToUrdu(text: string): Promise<string> {
  try {
    const response = await cohere.generate({
      prompt: `Translate the following English text to Urdu:\n\n${text}\n\nUrdu translation:`,
      max_tokens: 500,
      temperature: 0.3,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    return response.body.generations[0].text.trim();
  } catch (error) {
    console.error('Error translating to Urdu:', error);
    throw new Error('Failed to translate to Urdu');
  }
    .map(item => item.sentence);
  
  return topSentences.join('. ') + '.';
}

export function translateToUrdu(text: string, dictionary: Record<string, string>): string {
  // Simple word-by-word translation using the dictionary
  const words = text.split(' ');
  const translatedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    return dictionary[lowerWord] || word;
  });
  
  // Join words and add appropriate Urdu punctuation
  return translatedWords.join(' ').replace(/\./g, '۔');
}
