import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { SeoService } from './seo.service';
import { SeoData } from '../types/seo.types';

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { 
          provide: Meta, 
          useValue: { 
            updateTag: (tag: any) => {
              // Mock implementation
              return true;
            } 
          } 
        },
        { 
          provide: Title, 
          useValue: { 
            setTitle: (title: string) => {
              // Mock implementation
              return title;
            } 
          } 
        },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(SeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate correct SEO data for routes', () => {
    const homeSeo = service.getSeoDataForRoute('/');
    expect(homeSeo.title).toBe('Dancer - Media Synchronization Tool');
    expect(homeSeo.ogUrl).toBe('https://dancer-app.com/');

    const completeSeo = service.getSeoDataForRoute('/complete');
    expect(completeSeo.title).toBe('Video Generation Complete - Dancer');
    expect(completeSeo.ogUrl).toBe('https://dancer-app.com/complete');

    const gifSeo = service.getSeoDataForRoute('/gif/123');
    expect(gifSeo.title).toBe('Custom GIF - Dancer');
    expect(gifSeo.ogUrl).toBe('https://dancer-app.com/gif/123');
  });

  it('should resolve SEO data for dynamic routes with parameters', () => {
    const gifSeo = service.resolveSeoDataForRoute('/gif/123', { id: '123' });
    expect(gifSeo.title).toBe('GIF 123 - Dancer');
    expect(gifSeo.description).toContain('GIF 123');

    const completeSeo = service.resolveSeoDataForRoute('/complete/video-url', { videoUrl: 'video-url' });
    expect(completeSeo.title).toBe('Video Generation Complete - Dancer');
  });

  it('should generate meta tags HTML correctly', () => {
    const seoData: SeoData = {
      title: 'Test Title',
      description: 'Test Description',
      keywords: 'test, keywords',
      ogTitle: 'Test OG Title',
      ogDescription: 'Test OG Description',
      ogImage: 'https://example.com/image.jpg'
    };

    const html = service.generateMetaTagsHtml(seoData);
    
    expect(html).toContain('<title>Test Title</title>');
    expect(html).toContain('<meta name="description" content="Test Description">');
    expect(html).toContain('<meta name="keywords" content="test, keywords">');
    expect(html).toContain('<meta property="og:title" content="Test OG Title">');
    expect(html).toContain('<meta property="og:description" content="Test OG Description">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/image.jpg">');
  });

  it('should escape HTML content correctly', () => {
    const seoData: SeoData = {
      title: 'Test <script>alert("xss")</script>',
      description: 'Test & Description with "quotes"'
    };

    const html = service.generateMetaTagsHtml(seoData);
    
    expect(html).toContain('<title>Test &lt;script&gt;alert("xss")&lt;/script&gt;</title>');
    expect(html).toContain('<meta name="description" content="Test &amp; Description with "quotes"">');
  });
}); 