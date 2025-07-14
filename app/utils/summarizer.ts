export function generateSummary(text: string): string {
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  
  // Simple scoring based on sentence length and common important words
  const importantWords = ['important', 'significant', 'key', 'main', 'crucial', 'essential'];
  
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // Score based on sentence length (prefer medium-length sentences)
    const wordCount = sentence.split(' ').length;
    if (wordCount > 5 && wordCount < 25) {
      score += 3;
    }
    
    // Score based on important words
    importantWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) {
        score += 2;
      }
    });
    
    return { sentence: sentence.trim(), score };
  });
  
  // Sort by score and take top 3 sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
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
