import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SeoData, DefaultSeoConfig } from '../types/seo.types';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private defaultConfig: DefaultSeoConfig = {
    siteName: 'Dancer',
    siteUrl: 'https://dancer-app.com',
    defaultTitle: 'Dancer - Media Synchronization Tool',
    defaultDescription: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
    defaultImage: 'https://dancer-app.com/assets/og-image.jpg',
    defaultKeywords: 'media sync, gif creation, video editing, audio synchronization, media tools, web application',
    defaultAuthor: 'Dancer Team',
    themeColor: '#4A90E2'
  };

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /**
   * Update SEO data for the current page
   */
  updateSeoData(seoData: SeoData): void {
    // Update title
    if (seoData.title) {
      this.title.setTitle(seoData.title);
    }

    // Update primary meta tags
    this.updateMetaTag('name', 'title', seoData.title);
    this.updateMetaTag('name', 'description', seoData.description);
    this.updateMetaTag('name', 'keywords', seoData.keywords);
    this.updateMetaTag('name', 'author', seoData.author);
    this.updateMetaTag('name', 'robots', seoData.robots);
    this.updateMetaTag('name', 'language', seoData.language);
    this.updateMetaTag('name', 'revisit-after', seoData.revisitAfter);

    // Update Open Graph tags
    this.updateMetaTag('property', 'og:type', seoData.ogType);
    this.updateMetaTag('property', 'og:url', seoData.ogUrl);
    this.updateMetaTag('property', 'og:title', seoData.ogTitle);
    this.updateMetaTag('property', 'og:description', seoData.ogDescription);
    this.updateMetaTag('property', 'og:image', seoData.ogImage);
    this.updateMetaTag('property', 'og:site_name', seoData.ogSiteName);
    this.updateMetaTag('property', 'og:locale', seoData.ogLocale);

    // Update Twitter tags
    this.updateMetaTag('property', 'twitter:card', seoData.twitterCard);
    this.updateMetaTag('property', 'twitter:url', seoData.twitterUrl);
    this.updateMetaTag('property', 'twitter:title', seoData.twitterTitle);
    this.updateMetaTag('property', 'twitter:description', seoData.twitterDescription);
    this.updateMetaTag('property', 'twitter:image', seoData.twitterImage);

    // Update additional meta tags
    this.updateMetaTag('name', 'theme-color', seoData.themeColor);
    this.updateMetaTag('name', 'msapplication-TileColor', seoData.msTileColor);
    this.updateMetaTag('name', 'apple-mobile-web-app-capable', seoData.appleMobileWebAppCapable);
    this.updateMetaTag('name', 'apple-mobile-web-app-status-bar-style', seoData.appleMobileWebAppStatusBarStyle);
    this.updateMetaTag('name', 'apple-mobile-web-app-title', seoData.appleMobileWebAppTitle);

    // Update canonical URL (only on client-side)
    if (isPlatformBrowser(this.platformId)) {
      this.updateCanonicalUrl(seoData.canonicalUrl);
    }

    // Update structured data (only on client-side)
    if (isPlatformBrowser(this.platformId) && seoData.structuredData) {
      this.updateStructuredData(seoData.structuredData);
    }
  }

  /**
   * Update SEO data for a specific page with default values
   */
  updatePageSeo(pageTitle: string, pageDescription?: string, pageUrl?: string, additionalData?: Partial<SeoData>): void {
    const seoData: SeoData = {
      title: pageTitle,
      description: pageDescription || this.defaultConfig.defaultDescription,
      keywords: this.defaultConfig.defaultKeywords,
      author: this.defaultConfig.defaultAuthor,
      robots: 'index, follow',
      language: 'English',
      revisitAfter: '7 days',
      
      // Open Graph
      ogType: 'website',
      ogUrl: pageUrl || this.defaultConfig.siteUrl,
      ogTitle: pageTitle,
      ogDescription: pageDescription || this.defaultConfig.defaultDescription,
      ogImage: this.defaultConfig.defaultImage,
      ogSiteName: this.defaultConfig.siteName,
      ogLocale: 'en_US',
      
      // Twitter
      twitterCard: 'summary_large_image',
      twitterUrl: pageUrl || this.defaultConfig.siteUrl,
      twitterTitle: pageTitle,
      twitterDescription: pageDescription || this.defaultConfig.defaultDescription,
      twitterImage: this.defaultConfig.defaultImage,
      
      // Additional
      themeColor: this.defaultConfig.themeColor,
      msTileColor: this.defaultConfig.themeColor,
      appleMobileWebAppCapable: 'yes',
      appleMobileWebAppStatusBarStyle: 'default',
      appleMobileWebAppTitle: this.defaultConfig.siteName,
      
      // Canonical
      canonicalUrl: pageUrl || this.defaultConfig.siteUrl,
      
      ...additionalData
    };

    this.updateSeoData(seoData);
  }

  /**
   * Reset SEO data to default values
   */
  resetToDefault(): void {
    this.updatePageSeo(
      this.defaultConfig.defaultTitle,
      this.defaultConfig.defaultDescription,
      this.defaultConfig.siteUrl
    );
  }

  /**
   * Update a specific meta tag
   */
  private updateMetaTag(attr: string, selector: string, value?: string): void {
    if (value) {
      this.meta.updateTag({ [attr]: selector, content: value });
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url?: string): void {
    if (!url || !isPlatformBrowser(this.platformId)) return;

    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = url;
    document.head.appendChild(canonicalLink);
  }

  /**
   * Update structured data
   */
  private updateStructuredData(data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Generate structured data for a web application
   */
  generateWebAppStructuredData(appName: string, description: string, url: string, additionalData?: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: appName,
      description: description,
      url: url,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: this.defaultConfig.defaultAuthor
      },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      ...additionalData
    };
  }

  /**
   * Generate structured data for a page
   */
  generatePageStructuredData(pageTitle: string, description: string, url: string, additionalData?: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: description,
      url: url,
      datePublished: new Date().toISOString().split('T')[0],
      dateModified: new Date().toISOString().split('T')[0],
      ...additionalData
    };
  }

  /**
   * Set default SEO configuration
   */
  setDefaultConfig(config: Partial<DefaultSeoConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get current default configuration
   */
  getDefaultConfig(): DefaultSeoConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Generate meta tags as HTML string for server-side rendering
   */
  generateMetaTagsHtml(seoData: SeoData): string {
    const tags: string[] = [];

    // Title tag
    if (seoData.title) {
      tags.push(`<title>${this.escapeHtml(seoData.title)}</title>`);
    }

    // Primary meta tags
    if (seoData.description) {
      tags.push(`<meta name="description" content="${this.escapeHtml(seoData.description)}">`);
    }
    if (seoData.keywords) {
      tags.push(`<meta name="keywords" content="${this.escapeHtml(seoData.keywords)}">`);
    }
    if (seoData.author) {
      tags.push(`<meta name="author" content="${this.escapeHtml(seoData.author)}">`);
    }
    if (seoData.robots) {
      tags.push(`<meta name="robots" content="${this.escapeHtml(seoData.robots)}">`);
    }

    // Open Graph tags
    if (seoData.ogType) {
      tags.push(`<meta property="og:type" content="${this.escapeHtml(seoData.ogType)}">`);
    }
    if (seoData.ogUrl) {
      tags.push(`<meta property="og:url" content="${this.escapeHtml(seoData.ogUrl)}">`);
    }
    if (seoData.ogTitle) {
      tags.push(`<meta property="og:title" content="${this.escapeHtml(seoData.ogTitle)}">`);
    }
    if (seoData.ogDescription) {
      tags.push(`<meta property="og:description" content="${this.escapeHtml(seoData.ogDescription)}">`);
    }
    if (seoData.ogImage) {
      tags.push(`<meta property="og:image" content="${this.escapeHtml(seoData.ogImage)}">`);
    }
    if (seoData.ogSiteName) {
      tags.push(`<meta property="og:site_name" content="${this.escapeHtml(seoData.ogSiteName)}">`);
    }
    if (seoData.ogLocale) {
      tags.push(`<meta property="og:locale" content="${this.escapeHtml(seoData.ogLocale)}">`);
    }

    // Twitter tags
    if (seoData.twitterCard) {
      tags.push(`<meta property="twitter:card" content="${this.escapeHtml(seoData.twitterCard)}">`);
    }
    if (seoData.twitterUrl) {
      tags.push(`<meta property="twitter:url" content="${this.escapeHtml(seoData.twitterUrl)}">`);
    }
    if (seoData.twitterTitle) {
      tags.push(`<meta property="twitter:title" content="${this.escapeHtml(seoData.twitterTitle)}">`);
    }
    if (seoData.twitterDescription) {
      tags.push(`<meta property="twitter:description" content="${this.escapeHtml(seoData.twitterDescription)}">`);
    }
    if (seoData.twitterImage) {
      tags.push(`<meta property="twitter:image" content="${this.escapeHtml(seoData.twitterImage)}">`);
    }

    // Additional meta tags
    if (seoData.themeColor) {
      tags.push(`<meta name="theme-color" content="${this.escapeHtml(seoData.themeColor)}">`);
    }
    if (seoData.msTileColor) {
      tags.push(`<meta name="msapplication-TileColor" content="${this.escapeHtml(seoData.msTileColor)}">`);
    }
    if (seoData.appleMobileWebAppCapable) {
      tags.push(`<meta name="apple-mobile-web-app-capable" content="${this.escapeHtml(seoData.appleMobileWebAppCapable)}">`);
    }
    if (seoData.appleMobileWebAppStatusBarStyle) {
      tags.push(`<meta name="apple-mobile-web-app-status-bar-style" content="${this.escapeHtml(seoData.appleMobileWebAppStatusBarStyle)}">`);
    }
    if (seoData.appleMobileWebAppTitle) {
      tags.push(`<meta name="apple-mobile-web-app-title" content="${this.escapeHtml(seoData.appleMobileWebAppTitle)}">`);
    }

    // Canonical URL
    if (seoData.canonicalUrl) {
      tags.push(`<link rel="canonical" href="${this.escapeHtml(seoData.canonicalUrl)}">`);
    }

    // Structured data
    if (seoData.structuredData) {
      tags.push(`<script type="application/ld+json">${JSON.stringify(seoData.structuredData)}</script>`);
    }

    return tags.join('\n    ');
  }

  /**
   * Escape HTML content to prevent XSS
   */
  private escapeHtml(text: string): string {
    if (!isPlatformBrowser(this.platformId)) {
      // Server-side HTML escaping
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    } else {
      // Client-side HTML escaping
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  /**
   * Inject meta tags into document head for server-side rendering
   * This method should be called during SSR to inject dynamic meta tags
   */
  injectMetaTagsForSSR(seoData: SeoData): void {
    if (!isPlatformBrowser(this.platformId)) {
      // For server-side rendering, we need to inject meta tags into the document
      // This would typically be done through Angular's TransferState or similar mechanism
      // For now, we'll use the existing Angular Meta service which works on both platforms
      this.updateSeoData(seoData);
    }
  }

  /**
   * Get SEO data for a specific route (useful for server-side rendering)
   */
  getSeoDataForRoute(routePath: string): SeoData {
    // Default SEO data based on route
    switch (routePath) {
      case '/':
        return {
          title: 'Dancer - Media Synchronization Tool',
          description: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          keywords: 'media sync, gif creation, video editing, audio synchronization, media tools, web application',
          ogType: 'website',
          ogUrl: 'https://dancer-app.com/',
          ogTitle: 'Dancer - Media Synchronization Tool',
          ogDescription: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          ogImage: 'https://dancer-app.com/assets/og-image.jpg',
          twitterCard: 'summary_large_image',
          twitterTitle: 'Dancer - Media Synchronization Tool',
          twitterDescription: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          twitterImage: 'https://dancer-app.com/assets/twitter-image.jpg',
          canonicalUrl: 'https://dancer-app.com/'
        };
      case '/complete':
        return {
          title: 'Video Generation Complete - Dancer',
          description: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.',
          keywords: 'video generation, gif sync complete, download video, synchronized video, music video',
          ogType: 'website',
          ogUrl: 'https://dancer-app.com/complete',
          ogTitle: 'Video Generation Complete - Dancer',
          ogDescription: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.',
          ogImage: 'https://dancer-app.com/assets/og-image.jpg',
          twitterCard: 'summary_large_image',
          twitterTitle: 'Video Generation Complete - Dancer',
          twitterDescription: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.',
          twitterImage: 'https://dancer-app.com/assets/twitter-image.jpg',
          canonicalUrl: 'https://dancer-app.com/complete'
        };
      default:
        // For dynamic routes (like /gif/:id)
        if (routePath.startsWith('/gif/')) {
          return {
            title: 'Custom GIF - Dancer',
            description: 'View and sync this custom GIF with music using Dancer\'s professional media synchronization tool.',
            keywords: 'custom gif, gif sync, music sync, video creation, animation sync',
            ogType: 'website',
            ogUrl: `https://dancer-app.com${routePath}`,
            ogTitle: 'Custom GIF - Dancer',
            ogDescription: 'View and sync this custom GIF with music using Dancer\'s professional media synchronization tool.',
            ogImage: 'https://dancer-app.com/assets/og-image.jpg',
            twitterCard: 'summary_large_image',
            twitterTitle: 'Custom GIF - Dancer',
            twitterDescription: 'View and sync this custom GIF with music using Dancer\'s professional media synchronization tool.',
            twitterImage: 'https://dancer-app.com/assets/twitter-image.jpg',
            canonicalUrl: `https://dancer-app.com${routePath}`
          };
        }
        return {
          title: 'Dancer - Media Synchronization Tool',
          description: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          keywords: 'media sync, gif creation, video editing, audio synchronization, media tools, web application',
          ogType: 'website',
          ogUrl: 'https://dancer-app.com/',
          ogTitle: 'Dancer - Media Synchronization Tool',
          ogDescription: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          ogImage: 'https://dancer-app.com/assets/og-image.jpg',
          twitterCard: 'summary_large_image',
          twitterTitle: 'Dancer - Media Synchronization Tool',
          twitterDescription: 'Professional media synchronization tool for creating perfectly timed GIFs and videos with audio. Sync your media files effortlessly.',
          twitterImage: 'https://dancer-app.com/assets/twitter-image.jpg',
          canonicalUrl: 'https://dancer-app.com/'
        };
    }
  }

  /**
   * Resolve SEO data for dynamic routes with parameters
   * This method can be used by route resolvers to get SEO data before component initialization
   */
  resolveSeoDataForRoute(routePath: string, routeParams?: any): SeoData {
    const baseSeoData = this.getSeoDataForRoute(routePath);
    
    // Handle dynamic route parameters
    if (routePath.startsWith('/gif/') && routeParams?.id) {
      // You could fetch additional data about the GIF here
      // For now, we'll use the base data with the specific ID
      return {
        ...baseSeoData,
        title: `GIF ${routeParams.id} - Dancer`,
        description: `View and sync GIF ${routeParams.id} with music using Dancer's professional media synchronization tool.`,
        ogTitle: `GIF ${routeParams.id} - Dancer`,
        ogDescription: `View and sync GIF ${routeParams.id} with music using Dancer's professional media synchronization tool.`,
        twitterTitle: `GIF ${routeParams.id} - Dancer`,
        twitterDescription: `View and sync GIF ${routeParams.id} with music using Dancer's professional media synchronization tool.`
      };
    }
    
    if (routePath.startsWith('/complete/') && routeParams?.videoUrl) {
      return {
        ...baseSeoData,
        title: 'Video Generation Complete - Dancer',
        description: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.',
        ogTitle: 'Video Generation Complete - Dancer',
        ogDescription: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.',
        twitterTitle: 'Video Generation Complete - Dancer',
        twitterDescription: 'Your synchronized GIF and music video has been generated successfully. Download your creation or create another one.'
      };
    }
    
    return baseSeoData;
  }

  /**
   * Handle server-side SEO injection for a route
   * This should be called during server-side rendering to ensure meta tags are set
   */
  handleServerSideSeo(routePath: string, routeParams?: any): void {
    const seoData = this.resolveSeoDataForRoute(routePath, routeParams);
    this.injectMetaTagsForSSR(seoData);
  }

  /**
   * Check if current execution is on server-side
   */
  isServerSide(): boolean {
    return !isPlatformBrowser(this.platformId);
  }

  /**
   * Get meta tags HTML for server-side injection
   * This can be used to inject meta tags directly into the HTML response
   */
  getMetaTagsHtmlForRoute(routePath: string, routeParams?: any): string {
    const seoData = this.resolveSeoDataForRoute(routePath, routeParams);
    return this.generateMetaTagsHtml(seoData);
  }
} 