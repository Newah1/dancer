import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { environment } from '../../environments/environment';
import { FFmpegProgressService } from './ffmpeg-progress.service';

@Injectable({
  providedIn: 'root'
})
export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private progressService: FFmpegProgressService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Creating FFmpeg instance');
      this.ffmpeg = new FFmpeg();
    }
  }

  async load() {
    console.log('Load called, checking conditions:', {
      isBrowser: isPlatformBrowser(this.platformId),
      isLoaded: this.loaded,
      hasFFmpeg: !!this.ffmpeg,
      ffmpeg: this.ffmpeg
    });
    
    this.ffmpeg = new FFmpeg();

    if (!isPlatformBrowser(this.platformId) || this.loaded || !this.ffmpeg) {
      console.log('Early return from load');
      return;
    }

    this.ffmpeg.on('log', ({ message }) => {
      // console.log('FFmpeg log:', message);
      this.progressService.parseLogMessage(message);
    });

    const originalWorker = window.Worker;
    try {
      // Load FFmpeg core from environment configuration
      const corePath = environment.ffmpegCorePath;
      console.log('Starting FFmpeg load with core path:', corePath);
      // Override the worker initialization
      window.Worker = class CustomWorker extends originalWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          if (url instanceof URL && url.pathname.endsWith('worker.js')) {
            // Use the absolute URL to the worker file
            super(new URL('/worker.js', window.location.origin), options);
          } else {
            super(url, options);
          }
        }
      } as any;
      
      const loaded = await this.ffmpeg.load({
        coreURL: await toBlobURL(`${corePath}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${corePath}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${corePath}/ffmpeg-core.worker.js`, 'text/javascript'),
      });

      console.log('FFmpeg loaded successfully', loaded);
      this.loaded = true;
      return this.ffmpeg;
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      // throw error;
    } finally {
      window.Worker = originalWorker;
    }
    return this.ffmpeg;
  }

  async processFile(file: File): Promise<Blob> {
    console.log('Processing file:', file);
    if (!isPlatformBrowser(this.platformId) || !this.ffmpeg) {
      throw new Error('FFmpeg is not available in this environment');
    }

    console.log('this.loaded', this.loaded);

    if (!this.loaded) {
      console.log('Loading FFmpeg');
      await this.load();
    }

    // Write the file to FFmpeg's virtual filesystem
    const inputFileName = 'input.' + file.name.split('.').pop();
    await this.ffmpeg.writeFile(inputFileName, await fetchFile(file));
    console.log('File written to FFmpeg');

    // Example: Convert to MP4 (you can modify this based on your needs)
    const outputFileName = 'output.mp4';
    await this.ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      outputFileName
    ]);
    console.log('Conversion complete');

    // Read the result
    const data = await this.ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  }

  async createGifVideoWithAudio(
    gifFile: File,
    audioFile: File,
    fps: number,
    startTime?: number,
    endTime?: number,
    baseGifDelay = 0
  ): Promise<Blob> {
    if (!isPlatformBrowser(this.platformId) || !this.ffmpeg) {
      throw new Error('FFmpeg is not available in this environment');
    }

    if (!this.loaded) {
      await this.load();
    }

    // Reset progress service
    this.progressService.reset();

    console.log('Processing with params:', { fps, startTime, endTime });

    // Write input files to FFmpeg's virtual filesystem
    await this.ffmpeg.writeFile('input.gif', await fetchFile(gifFile));
    await this.ffmpeg.writeFile('input.mp3', await fetchFile(audioFile));

    // Build the FFmpeg command for the final video
    const command = [
      '-stream_loop', '-1',  // Loop the input indefinitely
      '-i', 'input.gif',
      '-i', 'input.mp3'
    ];

    // Add audio trimming if needed
    if (startTime !== undefined || endTime !== undefined) {
      if (startTime !== undefined) {
        command.push('-ss', startTime.toString());
      }
      if (endTime !== undefined) {
        command.push('-t', (endTime - (startTime || 0)).toString());
      }
    }

    // Add video and audio processing
    const baseGifFps = 1000 / baseGifDelay;  // Convert delay to FPS    
    // Calculate how much we need to adjust from FFmpeg's default to our target
    const speedFactor = baseGifFps / fps;

    console.log('Speed factor:', speedFactor, 'baseGifFps:', baseGifFps, 'fps:', fps);
    
    command.push(
      '-filter_complex', `[0:v]fps=24,setpts=${speedFactor}*PTS,scale=trunc(iw/2)*2:trunc(ih/2)*2[v]`,
      '-map', '[v]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-shortest',
      '-pix_fmt', 'yuv420p',
      'output.mp4'
    );

    console.log('Executing FFmpeg command:', command.join(' '));
    
    // Execute the command
    await this.ffmpeg.exec(command);

    // Read the result
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
} 