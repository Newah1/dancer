import { Component, ElementRef, input, OnInit, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { decompressFrames, ParsedFrame, parseGIF } from 'gifuct-js';
import { GenerateGifService } from '../services/generate-gif.service';

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
  private previousFrame: ParsedFrame | null = null;

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
    setTimeout(() => this.updateSliderIndicatorPosition(), 0);
  }

  resetGif(): void {
    this.stopGif();
    this.currentFrameIndex = 0;
    this.gifSpeedValue = 20;
    this.lastWheelDelta = 0;
    this.imageData = null;
    this.frames = [];
    this.interval = null;
    this.previousFrame = null;
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
      this.updateGifGenerationParams();
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
    this.updateSliderIndicatorPosition();
  }

  private updateGifGenerationParams() {
    try {
      const currentParams = this.generateGifService.getCurrentParams();
      // gifSpeedValue already represents FPS directly
      this.generateGifService.updateGenerationParams({
        ...currentParams,
        gifSpeed: this.gifSpeedValue
      });
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
    const mainContext = this.gifCanvas()?.nativeElement.getContext('2d');
    if (!context || !mainContext) {
      throw new Error('Failed to get canvas context');
    }

    let frameIndex = this.currentFrameIndex;

    this.interval = setInterval(() => {
      const frame = this.frames[frameIndex];
      const dims = frame.dims;

      // Handle disposal of previous frame
      if (this.previousFrame) {
        this.handleDisposal(mainContext, this.previousFrame, dims);
      }

      this.updateCanvasDimensions(context, dims);
      this.drawFrame(context, frame, dims, mainContext);

      this.previousFrame = frame;
      frameIndex = (frameIndex + 1) % this.frames.length;
      this.currentFrameIndex = frameIndex;
    }, 1000 / this.gifSpeedValue);
  }

  /**
   * Handles GIF disposal methods for proper frame transitions
   */
  private handleDisposal(
    mainContext: CanvasRenderingContext2D,
    previousFrame: ParsedFrame,
    currentDims: GifDimensions
  ): void {
    const canvas = mainContext.canvas;
    
    switch (previousFrame.disposalType) {
      case 0: // No disposal specified
        // Keep the previous frame
        break;
      case 1: // Do not dispose
        // Keep the previous frame
        break;
      case 2: // Restore to background color
        // Clear the area of the previous frame to background color
        mainContext.clearRect(
          previousFrame.dims.left,
          previousFrame.dims.top,
          previousFrame.dims.width,
          previousFrame.dims.height
        );
        break;
      case 3: // Restore to previous content
        // This is complex and not fully supported in most GIFs
        // For now, we'll clear the area
        mainContext.clearRect(
          previousFrame.dims.left,
          previousFrame.dims.top,
          previousFrame.dims.width,
          previousFrame.dims.height
        );
        break;
      default:
        // Unknown disposal method, clear the area
        mainContext.clearRect(
          previousFrame.dims.left,
          previousFrame.dims.top,
          previousFrame.dims.width,
          previousFrame.dims.height
        );
        break;
    }
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
    dims: GifDimensions,
    mainContext: CanvasRenderingContext2D
  ): void {
    if (!this.imageData || !this.tempCanvas) return;

    // Clear the temp canvas first
    context.clearRect(0, 0, dims.width, dims.height);
    
    // Set the frame data
    this.imageData.data.set(frame.patch);
    context.putImageData(this.imageData, 0, 0);

    // Draw the temp canvas onto the main canvas at the correct position
    mainContext.drawImage(this.tempCanvas, dims.left, dims.top);
  }

  private updateSliderIndicatorPosition(): void {
    // Find the slider container and set the --slider-value CSS variable
    const slider = document.getElementById('gif-speed') as HTMLInputElement;
    if (slider && slider.parentElement) {
      // Calculate percent (0-100)
      const min = parseInt(slider.min) || 1;
      const max = parseInt(slider.max) || 100;
      const value = parseInt(slider.value) || min;
      // Invert for vertical slider (top is max, bottom is min)
      const percent = 100 - ((value - min) / (max - min)) * 100;
      slider.parentElement.style.setProperty('--slider-value', percent.toString());
    }
  }
}
