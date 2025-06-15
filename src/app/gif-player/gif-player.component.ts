import { Component, ElementRef, input, OnInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { decompressFrames, ParsedFrame, parseGIF } from 'gifuct-js';
import { GenerateGifService } from '../services/generate-gif.service';
import { firstValueFrom } from 'rxjs';

interface GifDimensions {
  width: number;
  height: number;
  left: number;
  top: number;
}

@Component({
  selector: 'app-gif-player',
  imports: [CommonModule],
  templateUrl: './gif-player.component.html',
  styleUrl: './gif-player.component.scss',
})
export class GifPlayerComponent implements OnInit {
  private readonly gifCanvas =
  viewChild<ElementRef<HTMLCanvasElement>>('gifCanvas');

  gifArrayBuffer = input<ArrayBuffer | null>(null);
  showControls = input<boolean>(false);
  showFps = input<boolean>(false);


  frames: ParsedFrame[] = [];
  private tempCanvas: HTMLCanvasElement | null = null;
  private imageData: ImageData | null = null;
  private interval: NodeJS.Timeout | null = null;
  private currentFrameIndex = 0;
  protected gifSpeedValue = 20;
  private lastWheelDelta = 0;

  constructor(private generateGifService: GenerateGifService) {
    effect(() => {
      const buffer = this.gifArrayBuffer();
      if (buffer) {
        this.resetGif();
      }
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.tempCanvas = document.createElement('canvas');
    }

    this.resetGif();
  }

  resetGif(): void {
    this.stopGif();
    this.currentFrameIndex = 0;
    this.gifSpeedValue = 20;
    this.lastWheelDelta = 0;
    this.imageData = null;
    this.frames = [];
    this.interval = null;
    const buffer = this.gifArrayBuffer();
    if (buffer) {
      const gif = parseGIF(buffer);
      this.frames = decompressFrames(gif, true);
      
      if(this.frames.length > 0) {
        const baseDelay = this.frames[0].delay;
        this.generateGifService.setBaseGifDelay(baseDelay);

        this.gifSpeedValue = this.generateGifService.convertBaseGifDelayToFps(baseDelay);
      }

      this.updateCanvasSize();
      this.playGif();
    }
  }

  onGifSpeedChange(event: Event): void {

    const value = parseInt((event.target as HTMLInputElement).value);

    // if nan, set to 1
    if (isNaN(value)) {
      this.gifSpeedValue = 1;
    } else {
      this.gifSpeedValue = value;
    }

    console.log('gifSpeedValue', this.gifSpeedValue);

    this.stopGif();
    this.playGif();
    this.updateGifGenerationParams();
  }

  private async updateGifGenerationParams() {
    try {
      const currentParams = await firstValueFrom(this.generateGifService.getGenerationParams());
      if (currentParams) {
        // gifSpeedValue already represents FPS directly
        this.generateGifService.updateGenerationParams({
          ...currentParams,
          gifSpeed: this.gifSpeedValue
        });
      }
    } catch (error) {
      console.error('Error updating GIF generation params:', error);
    }
  }

  /**
   * Stops the GIF animation and cleans up resources
   */
  private stopGif(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Plays the GIF animation on the canvas
   */
  private playGif(): void {
    this.stopGif();
    const context = this.tempCanvas?.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    let frameIndex = this.currentFrameIndex;
    let needsDisposal = false;

    this.interval = setInterval(() => {
      if (needsDisposal) {
        context.clearRect(
          0,
          0,
          this.gifCanvas()?.nativeElement.width ?? 0,
          this.gifCanvas()?.nativeElement.height ?? 0
        );
        needsDisposal = false;
      }

      const frame = this.frames[frameIndex];
      const dims = frame.dims;

      this.updateCanvasDimensions(context, dims);
      this.drawFrame(context, frame, dims);

      frameIndex = (frameIndex + 1) % this.frames.length;
      needsDisposal = frame.disposalType === 2;
      this.currentFrameIndex = frameIndex;
    }, 1000 / this.gifSpeedValue);
  }

   /**
     * Updates the main canvas size based on the first frame
     */
   private updateCanvasSize(): void {
    if (!this.frames.length) return;

    const context = this.gifCanvas()?.nativeElement.getContext('2d');
    if (!context?.canvas || !this.tempCanvas) return;

    const { width, height } = this.frames[0].dims;
    context.canvas.width = width;
    context.canvas.height = height;
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
}

  /**
   * Updates canvas dimensions if needed
   */
  private updateCanvasDimensions(
    context: CanvasRenderingContext2D,
    dims: GifDimensions
  ): void {
    if (!this.imageData || this.imageData.width !== dims.width || this.imageData.height !== dims.height) {
      this.imageData = context.createImageData(dims.width, dims.height);
      if (this.tempCanvas) {
        this.tempCanvas.width = dims.width;
        this.tempCanvas.height = dims.height;
      }
    }
  }

  onScroll(event: WheelEvent): void {
    // Get the wheel delta (negative for scroll up, positive for scroll down)
    const delta = event.deltaY;
    
    // Map the wheel delta to a reasonable range (1-100)
    // Using a logarithmic scale to make it more manageable
    const speedChange = Math.log2(Math.abs(delta) + 1);
    const newSpeed = Math.min(100, Math.max(1, this.gifSpeedValue + (delta > 0 ? speedChange : -speedChange)));
    
    // Update the range input value
    const rangeInput = document.getElementById('gif-speed') as HTMLInputElement;
    if (rangeInput) {
      rangeInput.value = newSpeed.toString();
      const inputEvent = new Event('input');
      Object.defineProperty(inputEvent, 'target', { value: rangeInput });
      this.onGifSpeedChange(inputEvent);
    }
  }

  /**
   * Draws a single frame on the canvas
   */
  private drawFrame(
    context: CanvasRenderingContext2D,
    frame: ParsedFrame,
    dims: GifDimensions
  ): void {
    if (!this.imageData || !this.tempCanvas) return;

    this.imageData.data.set(frame.patch);
    context.putImageData(this.imageData, 0, 0);

    const canvas = this.gifCanvas()?.nativeElement;
    if (!canvas) return;

    const mainContext = canvas.getContext('2d');
    if (mainContext) {
      mainContext.drawImage(this.tempCanvas, dims.left, dims.top);
    }
  }
}
