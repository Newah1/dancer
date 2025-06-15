import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FFmpegProgressService } from '../services/ffmpeg-progress.service';

@Component({
  selector: 'app-progress-indicator',
  imports: [CommonModule],
  templateUrl: './progress-indicator.component.html',
  styleUrl: './progress-indicator.component.scss',
})
export class ProgressIndicatorComponent {
  ffmpegProgressService = inject(FFmpegProgressService);

  currentProgress = 0;

  constructor() {
    this.ffmpegProgressService.progress$.subscribe(progress => {
      this.currentProgress = progress.progress;
    });
  }
  
}
