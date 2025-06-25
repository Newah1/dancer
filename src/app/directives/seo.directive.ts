import { Directive, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SeoService } from '../services/seo.service';
import { SeoData } from '../types/seo.types';

@Directive({
  selector: '[appSeo]',
  standalone: true
})
export class SeoDirective implements OnInit, OnDestroy {
  @Input() appSeoData?: SeoData;
  @Input() seoTitle?: string;
  @Input() seoDescription?: string;
  @Input() seoUrl?: string;
  @Input() seoKeywords?: string;
  @Input() seoImage?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private seoService: SeoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Apply SEO data immediately
    this.applySeoData();

    // Listen for route changes to reapply SEO data
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applySeoData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applySeoData(): void {
    console.log('applySeoData', this.appSeoData);
    if (this.appSeoData) {
      // Use complete SEO data object
      this.seoService.updateSeoData(this.appSeoData);
    } else if (this.seoTitle) {
      // Use individual properties
      this.seoService.updatePageSeo(
        this.seoTitle,
        this.seoDescription,
        this.seoUrl,
        {
          keywords: this.seoKeywords,
          ogImage: this.seoImage,
          twitterImage: this.seoImage
        }
      );
    }
  }
} 