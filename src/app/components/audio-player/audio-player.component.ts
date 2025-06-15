import { Component, input, effect, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaveformVisualizerComponent } from './waveform-visualizer/waveform-visualizer.component';
import { GenerateGifService } from 'src/app/services/generate-gif.service';

@Component({
  selector: 'app-audio-player',
  imports: [CommonModule, WaveformVisualizerComponent],
  templateUrl: './audio-player.component.html',
  styleUrl: './audio-player.component.scss',
})
export class AudioPlayerComponent {
  audioFile = input<File>();
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;
  generateGifService = inject(GenerateGifService);
  
  isPlaying = false;
  audioUrl: string | null = null;
  currentTime = 0;
  duration = 0;

  constructor() {
    effect(() => {
      const file = this.audioFile();
      if (file) {
        this.setupAudioFile(file);
      }
    });
  }

  private setupAudioFile(file: File) {
    // Clean up previous audio URL if it exists
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }

    // Create new audio URL
    this.audioUrl = URL.createObjectURL(file);
    this.resetPlayer();
  }

  togglePlayPause() {
    if (!this.audioElement?.nativeElement) return;

    if (this.isPlaying) {
      this.audioElement.nativeElement.pause();
    } else {
      this.audioElement.nativeElement.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  resetPlayer() {
    if (this.audioElement?.nativeElement) {
      this.audioElement.nativeElement.pause();
      this.audioElement.nativeElement.currentTime = 0;
      this.isPlaying = false;
      this.currentTime = 0;
    }
  }

  onTimeUpdate() {
    if (this.audioElement?.nativeElement) {
      this.currentTime = this.audioElement.nativeElement.currentTime;
      this.duration = this.audioElement.nativeElement.duration;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  handleSeekAdjustTime(time: number) {
    console.log('handleSeekAdjustTime', time);
    if (this.audioElement?.nativeElement) {
      console.log('time', time);
      this.audioElement.nativeElement.currentTime = time;
      this.currentTime = time;
    }
  }

  ngOnDestroy() {
    // Clean up the audio URL when component is destroyed
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  get currentTimespan() {
    return this.generateGifService.getCurrentTimespan() || '00:00';
  }
}
