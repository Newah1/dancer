export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  language?: string;
  revisitAfter?: string;
  
  // Open Graph
  ogType?: string;
  ogUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;
  ogLocale?: string;
  
  // Twitter
  twitterCard?: string;
  twitterUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  
  // Additional
  themeColor?: string;
  msTileColor?: string;
  appleMobileWebAppCapable?: string;
  appleMobileWebAppStatusBarStyle?: string;
  appleMobileWebAppTitle?: string;
  
  // Canonical
  canonicalUrl?: string;
  
  // Structured Data
  structuredData?: any;
}

export interface PageSeoData extends SeoData {
  pageTitle: string;
  pageDescription: string;
  pageUrl: string;
}

export interface DefaultSeoConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  defaultKeywords: string;
  defaultAuthor: string;
  themeColor: string;
} 