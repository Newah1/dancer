import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #333;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'dancer';

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    // Initialize with default SEO data
    this.seoService.resetToDefault();
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
