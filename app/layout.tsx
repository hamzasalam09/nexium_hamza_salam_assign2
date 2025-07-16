import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Modern font setup with multiple weights and display optimization
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

// Arabic/Urdu font for better text rendering
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    template: "%s | AI Blog Summarizer",
    default: "AI Blog Summarizer - Convert Any Blog to English & Urdu Summaries",
  },
  description:
    "Transform lengthy blog posts into concise, intelligent summaries in both English and Urdu using advanced AI technology. Fast, accurate, and accessible content summarization.",
  keywords: [
    "blog summarizer",
    "AI content summarization",
    "English to Urdu translation",
    "content analysis",
    "text processing",
    "multilingual AI",
    "blog analysis",
    "content extraction",
  ],
  authors: [{ name: "Nexium AI Team" }],
  creator: "Nexium AI",
  publisher: "Nexium AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://blog-summarizer.nexium.ai",
    siteName: "AI Blog Summarizer",
    title: "AI Blog Summarizer - Convert Any Blog to English & Urdu Summaries",
    description:
      "Transform lengthy blog posts into concise, intelligent summaries in both English and Urdu using advanced AI technology.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AI Blog Summarizer - Intelligent Content Processing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Blog Summarizer - Convert Any Blog to English & Urdu Summaries",
    description:
      "Transform lengthy blog posts into concise, intelligent summaries in both English and Urdu using advanced AI technology.",
    images: ["/twitter-image.jpg"],
    creator: "@nexium_ai",
  },
  alternates: {
    canonical: "https://blog-summarizer.nexium.ai",
  },
  category: "Technology",
  classification: "AI Tools",
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-100"
      >
        <div className="relative min-h-screen">
          {/* Animated background elements */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-3xl dark:from-blue-600/20 dark:to-purple-600/20"></div>
            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-r from-green-400/30 to-blue-400/30 blur-3xl dark:from-green-600/20 dark:to-blue-600/20"></div>
          </div>
          
          {/* Skip to main content for accessibility */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium transition-all duration-200"
          >
            Skip to main content
          </a>
          
          <main 
            id="main-content" 
            className="relative z-10"
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
