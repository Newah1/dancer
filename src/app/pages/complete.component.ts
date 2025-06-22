import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-complete',
  imports: [CommonModule],
  templateUrl: './complete.component.html',
  styleUrl: './complete.component.scss',
})
export class CompleteComponent implements OnInit {
  generatedVideoUrl: SafeUrl | null = null;
  private generatedVideoBlob: Blob | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Get the video URL from route parameters
    this.route.params.subscribe(params => {
      const videoUrl = params['videoUrl'];
      if (videoUrl) {
        // Decode the URL and create a safe URL
        const decodedUrl = decodeURIComponent(videoUrl);
        this.generatedVideoUrl = this.sanitizer.bypassSecurityTrustUrl(decodedUrl);
        
        // Convert the URL back to a blob for download functionality
        fetch(decodedUrl)
          .then(response => response.blob())
          .then(blob => {
            this.generatedVideoBlob = blob;
          })
          .catch(error => {
            console.error('Error fetching video blob:', error);
          });
      }
    });
  }

  downloadVideo() {
    if (!this.generatedVideoBlob) {
      return;
    }

    const url = URL.createObjectURL(this.generatedVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synced-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onVideoError(event: Event) {
    console.error('Error playing video:', event);
  }

  tryAgain() {
    this.router.navigate(['/']);
  }
}
