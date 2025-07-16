import { cohereService, TranslationResult } from './cohere';

// Comprehensive English to Urdu dictionary for fallback translation
const ENGLISH_URDU_DICTIONARY: Record<string, string> = {
  // Basic words
  'the': 'یہ', 'and': 'اور', 'is': 'ہے', 'in': 'میں', 'to': 'کو',
  'of': 'کا', 'a': 'ایک', 'that': 'یہ', 'it': 'یہ', 'with': 'کے ساتھ',
  'for': 'کے لیے', 'as': 'جیسے', 'was': 'تھا', 'on': 'پر', 'are': 'ہیں',
  'you': 'آپ', 'this': 'یہ', 'be': 'ہونا', 'at': 'پر', 'by': 'کے ذریعے',
  'not': 'نہیں', 'or': 'یا', 'have': 'ہے', 'from': 'سے', 'they': 'وہ',
  'we': 'ہم', 'but': 'لیکن', 'can': 'کر سکتے ہیں', 'out': 'باہر',
  'other': 'دوسرے', 'were': 'تھے', 'all': 'تمام', 'there': 'وہاں',
  'when': 'جب', 'up': 'اوپر', 'use': 'استعمال', 'your': 'آپ کا',
  'how': 'کیسے', 'our': 'ہمارا', 'if': 'اگر', 'no': 'نہیں',
  'had': 'تھا', 'what': 'کیا', 'so': 'تو', 'about': 'کے بارے میں',
  
  // Time and quantity
  'time': 'وقت', 'very': 'بہت', 'would': 'گا', 'has': 'ہے',
  'more': 'زیادہ', 'many': 'بہت سے', 'some': 'کچھ', 'first': 'پہلا',
  'new': 'نیا', 'good': 'اچھا', 'great': 'عظیم', 'best': 'بہترین',
  'old': 'پرانا', 'small': 'چھوٹا', 'large': 'بڑا', 'long': 'لمبا',
  'short': 'چھوٹا', 'high': 'اونچا', 'low': 'نیچا', 'big': 'بڑا',
  
  // Actions
  'go': 'جانا', 'see': 'دیکھنا', 'make': 'بنانا', 'get': 'لینا',
  'come': 'آنا', 'know': 'جاننا', 'work': 'کام', 'give': 'دینا',
  'take': 'لینا', 'find': 'تلاش کرنا', 'think': 'سوچنا', 'say': 'کہنا',
  'tell': 'بتانا', 'ask': 'پوچھنا', 'feel': 'محسوس کرنا', 'try': 'کوشش کرنا',
  'help': 'مدد', 'show': 'دکھانا', 'play': 'کھیلنا', 'run': 'دوڑنا',
  
  // People and relationships
  'people': 'لوگ', 'person': 'شخص', 'man': 'آدمی', 'woman': 'عورت',
  'child': 'بچہ', 'family': 'خاندان', 'friend': 'دوست', 'teacher': 'استاد',
  'student': 'طالب علم', 'doctor': 'ڈاکٹر', 'engineer': 'انجینئر',
  
  // Places
  'world': 'دنیا', 'country': 'ملک', 'city': 'شہر', 'home': 'گھر',
  'school': 'اسکول', 'office': 'دفتر', 'hospital': 'ہسپتال',
  'market': 'بازار', 'place': 'جگہ', 'area': 'علاقہ',
  
  // Technology and business
  'technology': 'ٹیکنالوجی', 'business': 'کاروبار', 'company': 'کمپنی',
  'system': 'نظام', 'development': 'ترقی', 'software': 'سافٹ ویئر',
  'computer': 'کمپیوٹر', 'internet': 'انٹرنیٹ', 'website': 'ویب سائٹ',
  'data': 'ڈیٹا', 'information': 'معلومات', 'service': 'خدمت',
  'management': 'انتظام', 'project': 'منصوبہ', 'application': 'اپلیکیشن',
  'digital': 'ڈیجیٹل', 'online': 'آن لائن', 'mobile': 'موبائل',
  'platform': 'پلیٹ فارم', 'network': 'نیٹ ورک', 'security': 'سیکیورٹی',
  
  // Science and innovation
  'science': 'سائنس', 'research': 'تحقیق', 'study': 'مطالعہ',
  'analysis': 'تجزیہ', 'method': 'طریقہ', 'process': 'عمل',
  'result': 'نتیجہ', 'solution': 'حل', 'problem': 'مسئلہ',
  'innovation': 'جدت', 'future': 'مستقبل', 'change': 'تبدیلی',
  'growth': 'ترقی', 'progress': 'پیش قدمی', 'success': 'کامیابی',
  
  // AI and modern concepts
  'artificial': 'مصنوعی', 'intelligence': 'ذہانت', 'machine': 'مشین',
  'learning': 'سیکھنا', 'algorithm': 'الگورتھم', 'programming': 'پروگرامنگ',
  'code': 'کوڈ', 'database': 'ڈیٹابیس', 'design': 'ڈیزائن',
  'content': 'مواد', 'media': 'میڈیا', 'communication': 'رابطہ',
  'experience': 'تجربہ', 'performance': 'کارکردگی', 'quality': 'معیار',
  'support': 'سپورٹ', 'product': 'پروڈکٹ', 'customer': 'کسٹمر',
  
  // Education and knowledge
  'education': 'تعلیم', 'knowledge': 'علم', 'skill': 'مہارت',
  'training': 'تربیت', 'course': 'کورس', 'lesson': 'سبق',
  'book': 'کتاب', 'chapter': 'باب', 'page': 'صفحہ',
  
  // Health and society
  'health': 'صحت', 'medical': 'طبی', 'care': 'دیکھ بھال',
  'social': 'سماجی', 'community': 'کمیونٹی', 'society': 'معاشرہ',
  'culture': 'ثقافت', 'tradition': 'روایت', 'modern': 'جدید',
  
  // Economics and governance
  'economic': 'اقتصادی', 'financial': 'مالی', 'money': 'پیسہ',
  'cost': 'قیمت', 'price': 'قیمت', 'value': 'قدر',
  'government': 'حکومت', 'policy': 'پالیسی', 'law': 'قانون',
  'organization': 'تنظیم', 'institution': 'ادارہ',
  
  // Communication and content
  'blog': 'بلاگ', 'article': 'مضمون', 'story': 'کہانی',
  'news': 'خبر', 'report': 'رپورٹ', 'summary': 'خلاصہ',
  'description': 'تفصیل', 'example': 'مثال', 'detail': 'تفصیل',
  'point': 'نکتہ', 'idea': 'خیال', 'concept': 'تصور',
  
  // Descriptive words
  'important': 'اہم', 'main': 'بنیادی', 'key': 'کلیدی',
  'major': 'اہم', 'primary': 'بنیادی', 'basic': 'بنیادی',
  'simple': 'آسان', 'complex': 'پیچیدہ', 'difficult': 'مشکل',
  'easy': 'آسان', 'hard': 'مشکل', 'possible': 'ممکن',
  'available': 'دستیاب', 'necessary': 'ضروری', 'useful': 'مفید'
};

/**
 * Translate English text to Urdu using AI with dictionary fallback
 */
export async function translateToUrdu(text: string): Promise<string> {
  if (!text?.trim()) {
    throw new Error('Text is required for translation');
  }

  try {
    const result = await cohereService.translateWithRetry(text);
    return result.translatedText;
  } catch (error) {
    console.warn('AI translation failed, falling back to dictionary method:', error);
    return translateUsingDictionary(text);
  }
}

/**
 * Translate text using comprehensive dictionary (fallback method)
 */
export function translateUsingDictionary(text: string): string {
  if (!text?.trim()) {
    return '';
  }

  const words = preprocessTextForTranslation(text);
  const translatedWords = words.map(word => translateWord(word));
  
  return postprocessTranslation(translatedWords.join(' '));
}

/**
 * Get translation result with metadata
 */
export async function getTranslationResult(text: string): Promise<TranslationResult> {
  if (!text?.trim()) {
    throw new Error('Text is required for translation');
  }

  try {
    return await cohereService.translateWithRetry(text);
  } catch (error) {
    console.warn('AI translation failed, using dictionary fallback:', error);
    return {
      originalText: text,
      translatedText: translateUsingDictionary(text),
      language: 'urdu',
      confidence: 0.5, // Lower confidence for dictionary translation
    };
  }
}

/**
 * Translate multiple texts efficiently
 */
export async function translateMultiple(texts: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    texts.map(text => translateToUrdu(text))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.warn(`Translation failed for text ${index}:`, result.reason);
      return translateUsingDictionary(texts[index]);
    }
  });
}

/**
 * Check if text is likely already in Urdu
 */
export function isUrduText(text: string): boolean {
  const urduCharPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const urduCharCount = (text.match(new RegExp(urduCharPattern.source, 'g')) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  return totalChars > 0 && (urduCharCount / totalChars) > 0.3;
}

/**
 * Preprocess text for better dictionary translation
 */
function preprocessTextForTranslation(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Translate individual word using dictionary
 */
function translateWord(word: string): string {
  // Remove punctuation for lookup
  const cleanWord = word.replace(/[.,!?;:()[\]{}'"]/g, '');
  
  // Check exact match
  if (ENGLISH_URDU_DICTIONARY[cleanWord]) {
    return ENGLISH_URDU_DICTIONARY[cleanWord];
  }
  
  // Check for common variations
  const variations = generateWordVariations(cleanWord);
  for (const variation of variations) {
    if (ENGLISH_URDU_DICTIONARY[variation]) {
      return ENGLISH_URDU_DICTIONARY[variation];
    }
  }
  
  // Return original word if no translation found
  return word;
}

/**
 * Generate common word variations for better matching
 */
function generateWordVariations(word: string): string[] {
  const variations = [word];
  
  // Remove common suffixes
  const suffixesToRemove = ['ing', 'ed', 'er', 'est', 's', 'ly'];
  for (const suffix of suffixesToRemove) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      variations.push(word.slice(0, -suffix.length));
    }
  }
  
  // Handle plural forms
  if (word.endsWith('ies') && word.length > 4) {
    variations.push(word.slice(0, -3) + 'y');
  }
  
  return variations;
}

/**
 * Post-process dictionary translation to improve readability
 */
function postprocessTranslation(translation: string): string {
  return translation
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([۔؟!])\s*([^\s])/g, '$1 $2'); // Fix punctuation spacing
}

/**
 * Get dictionary statistics
 */
export function getDictionaryStats(): { totalWords: number; categories: string[] } {
  return {
    totalWords: Object.keys(ENGLISH_URDU_DICTIONARY).length,
    categories: [
      'Basic Words', 'Technology', 'Business', 'Science', 'Education',
      'Health', 'Society', 'Communication', 'Actions', 'Descriptive'
    ]
  };
}
