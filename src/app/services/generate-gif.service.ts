import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FFmpegService } from './ffmpeg.service';

export interface GifGenerationParams {
  startTime: number;
  endTime: number;
  gifSpeed: number;
  audioUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenerateGifService {
  private generationParams = new BehaviorSubject<GifGenerationParams | null>(null);

  // delay in milliseconds between frames (assumed all frames have the same delay)
  private baseGifDelay = 0;

  constructor(private ffmpegService: FFmpegService) {}

  updateGenerationParams(params: Partial<GifGenerationParams>) {
    const current = this.generationParams.getValue() || {
      startTime: 0,
      endTime: 0,
      gifSpeed: 30,
      audioUrl: ''
    };
    const updatedParams = { ...current, ...params };
    if (params.gifSpeed !== undefined) {
      console.log('updateGenerationParams - updating gifSpeed:', current.gifSpeed, '->', params.gifSpeed);
    }
    this.generationParams.next(updatedParams);
  }

  updateTimeParams(startTime: number, endTime: number, audioUrl: string) {
    const current = this.generationParams.getValue() || {
      startTime: 0,
      endTime: 0,
      gifSpeed: 30,
      audioUrl: ''
    };
    const updatedParams = { 
      ...current, 
      startTime, 
      endTime, 
      audioUrl 
    };
    console.log('updateTimeParams - preserving gifSpeed:', current.gifSpeed, '->', updatedParams.gifSpeed);
    this.generationParams.next(updatedParams);
  }

  getCurrentParams(): GifGenerationParams | null {
    return this.generationParams.getValue();
  }

  getCurrentTimespan() {
    const params = this.generationParams.getValue();

    if (!params) {
      return '00:00';
    }

    const totalSeconds = params.endTime - params.startTime;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getGenerationParams() {
    return this.generationParams.asObservable();
  }

  private async urlToFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }

  async generateGif(gifFile: File): Promise<Blob> {
    const params = this.generationParams.getValue();
    console.log(params);
    
    if (!params) {
      throw new Error('No generation parameters set');
    }

    try {
      // Convert audio URL to File object
      const audioFile = await this.urlToFile(params.audioUrl, 'audio.mp3');
      
      // Generate the video using FFmpeg service
      const result = await this.ffmpegService.createGifVideoWithAudio(
        gifFile,
        audioFile,
        params.gifSpeed,
        params.startTime,
        params.endTime,
        this.baseGifDelay
      );

      return result;
    } catch (error) {
      console.error('Error generating video:', error);
      throw error;
    }
  }
  
  setBaseGifDelay(delay: number) {
    this.baseGifDelay = delay;
  }

  getBaseGifDelay() {
    return this.baseGifDelay;
  }

  convertBaseGifDelayToFps(delay: number): number {
    // Convert ms between frames to frames per second
    // FPS = 1000ms / delay_ms
    return 1000 / delay;
  }
}
