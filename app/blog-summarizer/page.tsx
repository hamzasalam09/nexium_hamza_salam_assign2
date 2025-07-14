'use client';

import { useState } from 'react';

export default function BlogSummarizerPage() {
  const [url, setUrl] = useState('');

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
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Summarize
          </button>
        </div>
      </div>
    </div>
  );
}
