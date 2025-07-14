'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { scrapeBlogContent } from './utils/scraper';
import { generateSummary, translateToUrdu } from './utils/summarizer';
import { urduDictionary } from './utils/urduDictionary';

export default function BlogSummarizerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ english: '', urdu: '' });

  const handleSummarize = async () => {
    if (!url) {
      setError('Please enter a blog URL');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Scrape blog content
      const content = await scrapeBlogContent(url);

      // Generate summary and translation
      const englishSummary = await generateSummary(content);
      const urduSummary = await translateToUrdu(englishSummary);

      // Save to databases through API
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          englishSummary,
          urduSummary,
          fullText: content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

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
    <main className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Blog Summarizer</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Input
              type="url"
              placeholder="Enter blog URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button 
              onClick={handleSummarize}
              disabled={loading || !url}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Summarize'}
            </Button>

            {error && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 text-red-600">
                  {error}
                </CardContent>
              </Card>
            )}

            {summary.english && (
              <div className="mt-8 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">English Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{summary.english}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Urdu Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p dir="rtl" className="font-urdu text-right">{summary.urdu}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
