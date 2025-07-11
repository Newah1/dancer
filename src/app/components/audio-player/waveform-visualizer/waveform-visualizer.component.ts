import { Component, ElementRef, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenerateGifService } from '../../../services/generate-gif.service';

@Component({
  selector: 'app-waveform-visualizer',
  imports: [CommonModule],
  templateUrl: './waveform-visualizer.component.html',
  styleUrl: './waveform-visualizer.component.scss',
})
export class WaveformVisualizerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() audioUrl: string | null = null;
  @Input() isPlaying = false;
  @Input() currentTime = 0;
  @Input() duration = 0;
  @Output() seek = new EventEmitter<number>();
  @Output() startTimeChange = new EventEmitter<number>();
  @Output() endTimeChange = new EventEmitter<number>();

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private waveformData: { min: number; max: number }[] = [];
  
  // New properties for bracket positions
  public startBracketTime = 0;
  public endBracketTime = 0;
  public isDraggingStart = false;
  public isDraggingEnd = false;
  private readonly MIN_DURATION = 1; // Minimum duration in seconds
  private readonly PADDING = 20; // Padding on each side of the waveform

  constructor(private generateGifService: GenerateGifService) { }

  ngAfterViewInit() {
    this.setupCanvas();
    this.setupResizeObserver();
    this.setupClickHandler();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['audioUrl'] && this.audioUrl) {
      this.loadAudio();
    }
    if (changes['isPlaying']) {
      if (this.isPlaying) {
        this.startVisualization();
      } else {
        this.stopVisualization();
      }
    }
    if (changes['duration'] && changes['duration'].currentValue) {
      // Only initialize bracket positions if they haven't been set yet
      if (this.startBracketTime === 0 && this.endBracketTime === 0) {
        this.startBracketTime = 0;
        this.endBracketTime = changes['duration'].currentValue;
        this.drawWaveform();
      }
    }
    if (changes['currentTime']) {
      // Enforce playback boundaries
      const newTime = changes['currentTime'].currentValue;
      if (newTime < this.startBracketTime || newTime > this.endBracketTime) {
        this.seek.emit(this.startBracketTime);
      }
      // Always redraw the waveform when currentTime changes to update the progress indicator
      this.drawWaveform();
    }
  }

  private setupCanvas() {
    const canvas = this.canvas.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;

    this.canvasWidth = container.clientWidth;
    this.canvasHeight = container.clientHeight;

    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
  }

  private setupResizeObserver() {
    const container = this.canvas.nativeElement.parentElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        
        const canvas = this.canvas.nativeElement;
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        
        // Reprocess waveform data for new width
        if (this.audioBuffer) {
          this.processWaveformData();
        }
        
        this.drawWaveform();
      }
    });

    this.resizeObserver.observe(container);
  }

  private async loadAudio() {
    if (!this.audioUrl) return;

    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const response = await fetch(this.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Set duration and bracket times before drawing, but only if they haven't been set
      this.duration = this.audioBuffer.duration;
      if (this.startBracketTime === 0 && this.endBracketTime === 0) {
        this.startBracketTime = 0;
        this.endBracketTime = this.duration;
      }

      // Pre-process the waveform data
      this.processWaveformData();
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.drawWaveform();

      this.updateGifGenerationParams();
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  }

  private processWaveformData() {
    if (!this.audioBuffer) return;

    const channelData = this.audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.ceil(channelData.length / this.canvasWidth);
    this.waveformData = [];

    // Find the global maximum absolute value (peak)
    let globalMax = 0;
    for (let i = 0; i < channelData.length; i++) {
      globalMax = Math.max(globalMax, Math.abs(channelData[i]));
    }
    if (globalMax === 0) globalMax = 1e-6; // Avoid division by zero

    // Normalize each segment by the global peak
    for (let i = 0; i < this.canvasWidth; i++) {
      let min = 1.0;
      let max = -1.0;
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      for (let j = start; j < end; j++) {
        const datum = channelData[j] / globalMax;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      // Clamp to [-1, 1] just in case
      this.waveformData.push({
        min: Math.max(-1, Math.min(1, min)),
        max: Math.max(-1, Math.min(1, max))
      });
    }
  }

  private drawWaveform() {
    if (!this.canvas || !this.audioBuffer || this.waveformData.length === 0) return;

    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const amp = height / 2;
    const drawWidth = width - (this.PADDING * 2);

    // Clear the entire canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grayed out areas before start bracket
    const startBracketX = this.PADDING + (this.startBracketTime / this.duration) * drawWidth;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, startBracketX, height);

    // Draw grayed out areas after end bracket
    const endBracketX = this.PADDING + (this.endBracketTime / this.duration) * drawWidth;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(endBracketX, 0, width - endBracketX, height);
    
    // Draw the waveform
    ctx.beginPath();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;

    // Draw using pre-processed normalized data
    for (let i = 0; i < drawWidth; i++) {
      const { min, max } = this.waveformData[i];
      const x = i + this.PADDING;
      // Use the full height range for drawing
      const y1 = height * (0.5 - min * 0.5);
      const y2 = height * (0.5 - max * 0.5);
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }

    ctx.stroke();

    // Draw brackets
    this.drawBracket(ctx, startBracketX, height, true);
    this.drawBracket(ctx, endBracketX, height, false);

    // Draw progress indicator
    if (this.duration > 0) {
      const progress = this.PADDING + (this.currentTime / this.duration) * drawWidth;
      ctx.beginPath();
      ctx.strokeStyle = '#0056b3';
      ctx.lineWidth = 2;
      ctx.moveTo(progress, 0);
      ctx.lineTo(progress, height);
      ctx.stroke();
    }
  }

  private drawBracket(ctx: CanvasRenderingContext2D, x: number, height: number, isStart: boolean) {
    const bracketWidth = 30;
    
    ctx.beginPath();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    
    if (isStart) {
      // Draw start bracket
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(x, 0);
      ctx.lineTo(x + bracketWidth, 0);
      ctx.moveTo(x, height);
      ctx.lineTo(x + bracketWidth, height);
    } else {
      // Draw end bracket
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(x - bracketWidth, 0);
      ctx.lineTo(x, 0);
      ctx.moveTo(x - bracketWidth, height);
      ctx.lineTo(x, height);
    }
    
    ctx.stroke();
  }

  private startVisualization() {
    if (!this.analyser || !this.dataArray) return;

    const animate = () => {
      this.drawWaveform();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private stopVisualization() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private getBracketX(time: number): number {
    const drawWidth = this.canvasWidth - (this.PADDING * 2);
    return this.PADDING + (time / this.duration) * drawWidth;
  }

  private isNearBracket(x: number, bracketTime: number): boolean {
    const bracketX = this.getBracketX(bracketTime);
    const clickTolerance = 10;
    return Math.abs(x - bracketX) < clickTolerance;
  }

  private updateCursorStyle(canvas: HTMLCanvasElement, x: number) {
    const isOverStart = this.isNearBracket(x, this.startBracketTime);
    const isOverEnd = this.isNearBracket(x, this.endBracketTime);

    if (this.isDraggingStart || this.isDraggingEnd) {
      canvas.style.cursor = 'grabbing';
    } else if (isOverStart || isOverEnd) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }

  private updateTimestampsIfNeeded() {
    if (this.endBracketTime === 0) {
      this.endBracketTime = this.audioBuffer?.duration || 0;
    }
  }

  private updateGifGenerationParams() {
    this.generateGifService.updateTimeParams(
      this.startBracketTime,
      this.endBracketTime,
      this.audioUrl || ''
    );
  }

  private handleBracketDrag(x: number) {
    const clickPosition = Math.max(0, Math.min(1, x / this.canvasWidth));
    const newTime = clickPosition * this.duration;

    if (this.isDraggingStart) {
      const newStartTime = Math.max(0, Math.min(newTime, this.endBracketTime - this.MIN_DURATION));
      this.startBracketTime = newStartTime;
      this.startTimeChange.emit(this.startBracketTime);
    } else if (this.isDraggingEnd) {
      const newEndTime = Math.min(this.duration, Math.max(newTime, this.startBracketTime + this.MIN_DURATION));
      this.endBracketTime = newEndTime;
      this.endTimeChange.emit(this.endBracketTime);
    }

    this.drawWaveform();
    this.updateGifGenerationParams();
  }

  private setupClickHandler() {
    const canvas = this.canvas.nativeElement;
    
    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      
      this.updateCursorStyle(canvas, x);
      
      if (this.isDraggingStart || this.isDraggingEnd) {
        this.handleBracketDrag(x);
      }
    };

    const handleStart = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const clickPosition = x / this.canvasWidth;
      const clickTime = clickPosition * this.duration;

      if (this.isNearBracket(x, this.startBracketTime)) {
        this.isDraggingStart = true;
        return;
      }

      if (this.isNearBracket(x, this.endBracketTime)) {
        this.isDraggingEnd = true;
        return;
      }

      // If not clicking on brackets, handle normal seek
      if (clickTime >= this.startBracketTime && clickTime <= this.endBracketTime) {
        this.seek.emit(clickTime);
      }
    };

    const handleEnd = () => {
      this.isDraggingStart = false;
      this.isDraggingEnd = false;
    };

    // Mouse events
    canvas.addEventListener('mousemove', (event: MouseEvent) => {
      handleMove(event.clientX);
    });

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
      handleStart(event.clientX);
      event.preventDefault();
    });

    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', () => {
      handleEnd();
      canvas.style.cursor = 'default';
    });

    // Touch events
    canvas.addEventListener('touchmove', (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling while dragging
      if (event.touches.length > 0) {
        handleMove(event.touches[0].clientX);
      }
    }, { passive: false });

    canvas.addEventListener('touchstart', (event: TouchEvent) => {
      event.preventDefault(); // Prevent default touch behavior
      if (event.touches.length > 0) {
        handleStart(event.touches[0].clientX);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleEnd);
  }

  ngOnDestroy() {
    this.stopVisualization();
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // Add timestamp formatting method
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Add timestamp input handlers
  public onStartTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = this.parseTimeInput(input.value);
    if (time !== null && time >= 0 && time <= this.endBracketTime - this.MIN_DURATION) {
      this.startBracketTime = time;
      this.startTimeChange.emit(this.startBracketTime);
      this.drawWaveform();
      this.updateGifGenerationParams();
    }
  }

  public onEndTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = this.parseTimeInput(input.value);
    if (time !== null && time <= this.duration && time >= this.startBracketTime + this.MIN_DURATION) {
      this.endBracketTime = time;
      this.endTimeChange.emit(this.endBracketTime);
      this.drawWaveform();
      this.updateGifGenerationParams();
    }
  }

  private parseTimeInput(input: string): number | null {
    // Handle MM:SS format
    const match = input.match(/^(\d+):(\d{2})$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      if (seconds < 60) {
        return minutes * 60 + seconds;
      }
    }
    return null;
  }
}
