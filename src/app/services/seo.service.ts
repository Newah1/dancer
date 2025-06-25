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
    if (!isPlatformBrowser(this.platformId)) {
      return; // Don't update meta tags on server-side
    }

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

    // Update canonical URL
    this.updateCanonicalUrl(seoData.canonicalUrl);

    // Update structured data
    if (seoData.structuredData) {
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
    if (!url) return;

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
} 