import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SitemapService {
  private baseUrl = 'https://dancer-app.com';

  constructor(private router: Router) {}

  /**
   * Generate sitemap XML content
   */
  generateSitemapXml(): string {
    const urls = this.getSitemapUrls();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.baseUrl}${url.url}</loc>\n`;
      
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority) {
        xml += `    <priority>${url.priority}</priority>\n`;
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  }

  /**
   * Get all sitemap URLs
   */
  private getSitemapUrls(): SitemapUrl[] {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return [
      {
        url: '/',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 1.0
      },
      {
        url: '/complete',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.8
      }
    ];
  }

  /**
   * Download sitemap XML file
   */
  downloadSitemap(): void {
    const xml = this.generateSitemapXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get robots.txt content
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin or private areas (if any)
Disallow: /admin/
Disallow: /private/

# Allow all other pages
Allow: /`;
  }

  /**
   * Download robots.txt file
   */
  downloadRobotsTxt(): void {
    const content = this.generateRobotsTxt();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 