import { SeoData } from '../types/seo.types';

/**
 * SEO Utility Functions
 */
export class SeoUtils {
  
  /**
   * Validate SEO data
   */
  static validateSeoData(data: Partial<SeoData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate title
    if (data.title && data.title.length > 60) {
      errors.push('Title should be 60 characters or less');
    }

    // Validate description
    if (data.description && data.description.length > 160) {
      errors.push('Description should be 160 characters or less');
    }

    // Validate keywords
    if (data.keywords && data.keywords.split(',').length > 10) {
      errors.push('Keywords should be 10 or fewer');
    }

    // Validate URLs
    if (data.ogUrl && !this.isValidUrl(data.ogUrl)) {
      errors.push('Invalid Open Graph URL');
    }

    if (data.twitterUrl && !this.isValidUrl(data.twitterUrl)) {
      errors.push('Invalid Twitter URL');
    }

    if (data.canonicalUrl && !this.isValidUrl(data.canonicalUrl)) {
      errors.push('Invalid canonical URL');
    }

    // Validate image URLs
    if (data.ogImage && !this.isValidUrl(data.ogImage)) {
      errors.push('Invalid Open Graph image URL');
    }

    if (data.twitterImage && !this.isValidUrl(data.twitterImage)) {
      errors.push('Invalid Twitter image URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate meta description from content
   */
  static generateDescription(content: string, maxLength: number = 160): string {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Remove extra whitespace
    const cleanText = plainText.replace(/\s+/g, ' ').trim();
    
    // Truncate to max length
    return this.truncateText(cleanText, maxLength);
  }

  /**
   * Extract keywords from content
   */
  static extractKeywords(content: string, maxKeywords: number = 10): string[] {
    // Remove HTML tags and convert to lowercase
    const plainText = content.replace(/<[^>]*>/g, '').toLowerCase();
    
    // Remove common words and punctuation
    const words = plainText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isCommonWord(word));
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Check if word is a common word
   */
  private static isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
      'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
      'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
      'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
      'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
      'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
      'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
      'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
      'give', 'day', 'most', 'us'
    ];
    return commonWords.includes(word);
  }

  /**
   * Generate Open Graph image dimensions
   */
  static getOgImageDimensions(): { width: number; height: number } {
    return {
      width: 1200,
      height: 630
    };
  }

  /**
   * Generate Twitter image dimensions
   */
  static getTwitterImageDimensions(): { width: number; height: number } {
    return {
      width: 1200,
      height: 600
    };
  }

  /**
   * Sanitize text for meta tags
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/"/g, '&quot;') // Escape quotes
      .replace(/'/g, '&#39;') // Escape apostrophes
      .trim();
  }

  /**
   * Generate structured data for breadcrumbs
   */
  static generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): any {
    const items = breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    };
  }

  /**
   * Generate structured data for organization
   */
  static generateOrganizationStructuredData(orgData: {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    socialProfiles?: string[];
  }): any {
    const data: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': orgData.name,
      'url': orgData.url
    };

    if (orgData.logo) {
      data.logo = orgData.logo;
    }

    if (orgData.description) {
      data.description = orgData.description;
    }

    if (orgData.socialProfiles && orgData.socialProfiles.length > 0) {
      data.sameAs = orgData.socialProfiles;
    }

    return data;
  }

  /**
   * Generate structured data for FAQ
   */
  static generateFaqStructuredData(faqs: Array<{ question: string; answer: string }>): any {
    const mainEntity = faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': mainEntity
    };
  }
} 