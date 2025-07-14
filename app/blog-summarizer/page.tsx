'use client';

import { useState } from 'react';
import { scrapeBlogContent } from '../utils/scraper';
import { generateSummary, translateToUrdu } from '../utils/summarizer';
import { saveSummaryToSupabase, saveFullTextToMongoDB } from '../utils/database';
import { urduDictionary } from '../utils/urduDictionary';

export default function BlogSummarizerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ english: '', urdu: '' });

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError('');

      // Scrape blog content
      const content = await scrapeBlogContent(url);

      // Generate summary
      const englishSummary = generateSummary(content);
      const urduSummary = translateToUrdu(englishSummary, urduDictionary);

      // Save to databases
      await Promise.all([
        saveSummaryToSupabase({
          url,
          summary: englishSummary,
          urduSummary
        }),
        saveFullTextToMongoDB({
          url,
          fullText: content,
          timestamp: new Date()
        })
      ]);

      setSummary({
        english: englishSummary,
        urdu: urduSummary
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog Summarizer</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-4">
          <input
            type="url"
            placeholder="Enter blog URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={loading}
          />
          <button
            onClick={handleSummarize}
            disabled={loading || !url}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : 'Summarize'}
          </button>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {summary.english && (
            <div className="mt-8 space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="font-bold mb-2">English Summary</h2>
                <p>{summary.english}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="font-bold mb-2">Urdu Summary</h2>
                <p dir="rtl" className="font-urdu">{summary.urdu}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
