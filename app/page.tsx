'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner, LoadingDots, ProgressBar } from '@/components/ui/loading';
import { 
  SparklesIcon, 
  GlobeIcon, 
  BrainIcon, 
  BookOpenIcon, 
  ZapIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  ArrowRightIcon 
} from '@/components/ui/icons';
import { scrapeBlogContent } from './utils/scraper';
import { generateSummary, translateToUrdu } from './utils/summarizer';
import { validateConfig } from './config';

type ProcessingStep = 'idle' | 'scraping' | 'summarizing' | 'translating' | 'saving' | 'completed';



export default function BlogSummarizerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState({ english: '', urdu: '' });
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);

  // Validate config on component mount
  useEffect(() => {
    try {
      const validation = validateConfig();
      if (!validation.isValid) {
        console.warn('Some environment variables are missing:', validation.missingVars);
      }
    } catch (err) {
      console.error('Configuration validation error:', err);
    }
  }, []);

  const getStepProgress = (currentStep: ProcessingStep): number => {
    const steps = { idle: 0, scraping: 25, summarizing: 50, translating: 75, saving: 90, completed: 100 };
    return steps[currentStep] || 0;
  };

  const getStepMessage = (currentStep: ProcessingStep): string => {
    const messages = {
      idle: 'Ready to process',
      scraping: 'Extracting content from blog...',
      summarizing: 'Generating summary with Cohere AI...',
      translating: 'Translating to Urdu with Cohere AI...',
      saving: 'Saving to MongoDB & Supabase...',
      completed: 'Processing completed!'
    };
    return messages[currentStep] || '';
  };

  const handleSummarize = async () => {
    if (!url) {
      setError('Please enter a valid blog URL');
      return;
    }

    // URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/blog-post)');
      return;
    }



    try {
      setLoading(true);
      setError('');
      setSummary({ english: '', urdu: '' });
      setProgress(0);
      
      // Scrape blog content
      setStep('scraping');
      setProgress(getStepProgress('scraping'));
      const content = await scrapeBlogContent(url).catch(() => {
        throw new Error('Failed to extract content from the provided URL. Please verify the URL is accessible and contains readable content.');
      });

      // Generate summary
      setStep('summarizing');
      setProgress(getStepProgress('summarizing'));
      const englishSummary = await generateSummary(content).catch(() => {
        throw new Error('Failed to generate summary. The AI service may be temporarily unavailable.');
      });

      // Translate to Urdu
      setStep('translating');
      setProgress(getStepProgress('translating'));
      const urduSummary = await translateToUrdu(englishSummary).catch(() => {
        throw new Error('Failed to translate to Urdu. The translation service may be temporarily unavailable.');
      });

      // Save to databases through API
      setStep('saving');
      setProgress(getStepProgress('saving'));
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
        throw new Error('Failed to save data to the database. Please try again.');
      }

      setStep('completed');
      setProgress(getStepProgress('completed'));
      setSummary({
        english: englishSummary,
        urdu: urduSummary
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setStep('idle');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setSummary({ english: '', urdu: '' });
    setError('');
    setStep('idle');
    setProgress(0);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
              <BrainIcon size={32} className="text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          <span className="gradient-text">AI Blog Summarizer</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Transform lengthy blog posts into concise, intelligent summaries in both{' '}
          <span className="text-primary font-semibold">English</span> and{' '}
          <span className="text-primary font-semibold">Urdu</span> using advanced AI technology.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <ZapIcon size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Lightning Fast</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <GlobeIcon size={20} className="text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">Multilingual</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <SparklesIcon size={20} className="text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">AI-Powered</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="glass shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <BookOpenIcon size={24} className="text-primary" />
              Process Your Blog
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">


            {/* URL Input */}
            <div className="space-y-3">
              <label htmlFor="blog-url" className="block text-sm font-semibold text-foreground">
                Blog URL <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="blog-url"
                  type="url"
                  placeholder="https://example.com/interesting-blog-post"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="pl-4 pr-12 py-3 text-base border-2 focus:border-primary transition-all duration-200"
                  aria-describedby={error ? "url-error" : "url-help"}
                />
                {url && !loading && (
                  <button
                    onClick={() => setUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear URL"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p id="url-help" className="text-sm text-muted-foreground">
                Enter the full URL of the blog post you want to summarize
              </p>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleSummarize}
              disabled={loading || !url.trim()}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
              aria-describedby="button-status"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3" id="button-status">
                  <LoadingSpinner size="sm" className="text-white" />
                  <span>{getStepMessage(step)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <SparklesIcon size={20} />
                  <span>Summarize Blog</span>
                  <ArrowRightIcon size={16} />
                </div>
              )}
            </Button>

            {/* Progress Bar */}
            {loading && (
              <div className="space-y-4">
                <ProgressBar 
                  progress={progress} 
                  showPercentage={true}
                  className="mt-4"
                />
                <div className="flex items-center justify-center gap-3 text-sm">
                  {step === 'scraping' && (
                    <>
                      <BookOpenIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{getStepMessage(step)}</span>
                    </>
                  )}
                  {(step === 'summarizing' || step === 'translating') && (
                    <>
                      <BrainIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{getStepMessage(step)}</span>
                    </>
                  )}
                  {step === 'saving' && (
                    <>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-600 dark:text-green-400">
                          <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218z"/>
                        </svg>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-purple-600 dark:text-purple-400">
                          <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 0 1.028l.401.562 9.081 12.261a.396.396 0 0 0 .716-.233V14.646h9.362a.396.396 0 0 0 .362-.396V9.75a.396.396 0 0 0-.362-.396z"/>
                        </svg>
                      </div>
                      <span className="text-green-700 dark:text-green-300 font-medium">{getStepMessage(step)}</span>
                    </>
                  )}
                  {step !== 'scraping' && step !== 'summarizing' && step !== 'translating' && step !== 'saving' && (
                    <>
                      <LoadingDots className="text-primary" />
                      <span className="text-muted-foreground font-medium">{getStepMessage(step)}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 dark:text-red-200 font-medium mb-1">
                        Processing Error
                      </p>
                      <p className="text-red-700 dark:text-red-300 text-sm" id="url-error">
                        {error}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Reset Button */}
            {step === 'completed' && !loading && (
              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full py-3 font-medium border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                Process Another Blog
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {summary.english && (
          <div className="mt-12 space-y-8">
            {/* Success Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <CheckCircleIcon size={24} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2">Summary Complete!</h2>
              <p className="text-muted-foreground">
                Your blog post has been successfully processed and translated.
              </p>
            </div>

            {/* English Summary */}
            <Card className="glass shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-blue-200 dark:border-blue-800">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <GlobeIcon size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  English Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed">{summary.english}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Urdu Summary */}
            <Card className="glass shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-emerald-200 dark:border-emerald-800">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-lg">
                    <BookOpenIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  اردو خلاصہ (Urdu Summary)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p 
                    dir="rtl" 
                    className="font-arabic text-base leading-relaxed text-right"
                    lang="ur"
                  >
                    {summary.urdu}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Technology Stack Section */}
      <div className="mt-16 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Powered by Industry-Leading Technologies</h3>
            <p className="text-muted-foreground">
              Built with cutting-edge AI and database technologies for optimal performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cohere AI */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BrainIcon size={20} className="text-white" />
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100">Cohere AI</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Advanced natural language processing for intelligent summarization and multilingual translation
              </p>
            </div>

            {/* MongoDB */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-green-900 dark:text-green-100">MongoDB</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Flexible NoSQL database for storing and managing blog content and summaries at scale
              </p>
            </div>

            {/* Supabase */}
            <div className="group p-6 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.401.562a1.04 1.04 0 0 0 0 1.028l.401.562 9.081 12.261a.396.396 0 0 0 .716-.233V14.646h9.362a.396.396 0 0 0 .362-.396V9.75a.396.396 0 0 0-.362-.396z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-purple-900 dark:text-purple-100">Supabase</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Open-source backend platform providing real-time database and authentication services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Powered by <span className="font-semibold">Cohere AI</span>, <span className="font-semibold">MongoDB</span> & <span className="font-semibold">Supabase</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Built with accessibility and performance in mind • Next.js & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
