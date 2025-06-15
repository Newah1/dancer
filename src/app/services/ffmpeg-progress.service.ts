import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface FFmpegProgress {
  status: 'initializing' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  currentTime: number; // in seconds
  totalTime: number; // in seconds
  speed: number; // processing speed multiplier
  fps: number;
  frame: number;
  bitrate: number; // in kbits/s
  size: number; // in KB
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FFmpegProgressService {
  private progressSubject = new BehaviorSubject<FFmpegProgress>({
    status: 'initializing',
    progress: 0,
    currentTime: 0,
    totalTime: 0,
    speed: 0,
    fps: 0,
    frame: 0,
    bitrate: 0,
    size: 0
  });

  public progress$: Observable<FFmpegProgress> = this.progressSubject.asObservable();

  private totalDuration = 0;
  private durationMatchCount = 0;

  public initialize(duration: number) {
    this.totalDuration = duration;
    this.progressSubject.next({
      status: 'initializing',
      progress: 0,
      currentTime: 0,
      totalTime: duration,
      speed: 0,
      fps: 0,
      frame: 0,
      bitrate: 0,
      size: 0
    });

    this.progressSubject.pipe(tap(
        progress => {
            console.log('progress', progress);
        }
    ))
  }

  public parseLogMessage(message: string) {
    console.log('Parsing FFmpeg log message:', message);

    // Parse input duration from command if not already set
    const durationMatch = message.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durationMatch) {
      this.durationMatchCount++;
      if (this.durationMatchCount === 2 && !this.totalDuration) {
        console.log('Found duration in command:', durationMatch[1]);
        this.totalDuration = 
          parseInt(durationMatch[1]) * 3600 + // hours
          parseInt(durationMatch[2]) * 60 +    // minutes
          parseInt(durationMatch[3]) +         // seconds
          parseInt(durationMatch[4]) / 100;    // centiseconds
        this.progressSubject.next({
          ...this.progressSubject.value,
          totalTime: this.totalDuration
        });
      }
    }

    // Parse progress information
    const progressMatch = message.match(/frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+q=([\d.-]+)\s+size=\s*(\d+)kB\s+time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})\s+bitrate=\s*([\d.N/A]+)kbits\/s(?:\s+dup=\d+\s+drop=\d+)?\s+speed=\s*([\d.]+)x/);
    
    if (progressMatch) {
      console.log('Found progress information in message');
      const [
        , frame, fps, q, size, 
        hours, minutes, seconds, centiseconds, 
        bitrate, speed
      ] = progressMatch;

      const currentTime = 
        parseInt(hours) * 3600 + 
        parseInt(minutes) * 60 + 
        parseInt(seconds) + 
        parseInt(centiseconds) / 100;

      const progress = (currentTime / this.totalDuration) * 100;

      console.log('Calculated progress:', {
        currentTime,
        totalDuration: this.totalDuration,
        progress,
        speed,
        fps,
        frame,
        bitrate,
        size
      });

      this.progressSubject.next({
        status: 'processing',
        progress: Math.min(progress, 100),
        currentTime,
        totalTime: this.totalDuration,
        speed: parseFloat(speed),
        fps: parseFloat(fps),
        frame: parseInt(frame),
        bitrate: bitrate === 'N/A' ? 0 : parseFloat(bitrate),
        size: parseInt(size)
      });
    }

    // Check for completion
    if (message.includes('Lsize=')) {
      console.log('Processing completed');
      this.progressSubject.next({
        ...this.progressSubject.value,
        status: 'completed',
        progress: 100
      });
    }

    // Check for errors
    if (message.includes('Error') || message.includes('Aborted')) {
      console.error('FFmpeg error encountered:', message);
      this.progressSubject.next({
        ...this.progressSubject.value,
        status: 'error',
        error: message
      });
    }
  }

  public reset() {
    this.totalDuration = 0;
    this.durationMatchCount = 0;
    this.progressSubject.next({
      status: 'initializing',
      progress: 0,
      currentTime: 0,
      totalTime: 0,
      speed: 0,
      fps: 0,
      frame: 0,
      bitrate: 0,
      size: 0
    });
  }
} 