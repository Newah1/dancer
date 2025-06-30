import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FileUploadEvent, UploadComponent } from "src/app/upload.component";
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GifPlayerComponent } from "src/app/gif-player/gif-player.component";
import { GenerateGifService } from '../../services/generate-gif.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AudioPlayerComponent } from "../../components/audio-player/audio-player.component";
import { ProgressIndicatorComponent } from "../../components/progress-indicator.component";
import { Router, ActivatedRoute } from '@angular/router';
import { SeoDirective } from '../../directives/seo.directive';

@Component({
    selector: 'app-media-sync',
    imports: [CommonModule, UploadComponent, GifPlayerComponent, AudioPlayerComponent, ProgressIndicatorComponent, SeoDirective],
    schemas: [NO_ERRORS_SCHEMA],
    templateUrl: './media-sync.component.html',
    styleUrls: ['./media-sync.component.scss']
})
export class MediaSyncComponent {
    
    @ViewChild('waveformCanvas') private readonly waveformCanvas!: ElementRef<HTMLCanvasElement>;
    
    isDraggingMap = new Map<string, boolean>();
    audioBuffer: AudioBuffer | null = null;
    isPlaying = false;

    gifArrayBuffer: ArrayBuffer | null = null;
    musicFile: File | null = null;
    private generatedVideoBlob: Blob | null = null;
    audioUrl: string | null = null;
    currentTime = 0;
    duration = 0;
    startBracketTime = 0;
    endBracketTime = 0;
    generatingVideo = false;
    loadingGif = false;

    // Route data properties
    gifUrl: string | null = null;
    gifId: string | null = null;

    seoTitle: string | null = null;
    seoDescription: string | null = null;
    seoKeywords: string | null = null;

    constructor(
        private generateGifService: GenerateGifService,
        private sanitizer: DomSanitizer,
        private router: Router,
        private route: ActivatedRoute
    ) {
        // Access route data
        this.route.data.subscribe(data => {
            this.gifUrl = data['url'];
            
            this.seoTitle = data['seoTitle'];
            this.seoDescription = data['seoDescription'];
            this.seoKeywords = data['seoKeywords'];
            console.log('GIF URL:', this.gifUrl); // 'gif' for /gif/:id routes
            
            // If GIF URL is provided, automatically load the GIF
            if (this.gifUrl) {
                this.loadGifFromUrl(this.gifUrl);
            }
        });
    }

    private async loadGifFromUrl(url: string): Promise<void> {
        try {
            this.loadingGif = true;
            console.log('Loading GIF from URL:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.gifArrayBuffer = arrayBuffer;
            console.log('GIF loaded successfully from URL');
        } catch (error) {
            console.error('Error loading GIF from URL:', error);
            // You might want to show a user-friendly error message here
        } finally {
            this.loadingGif = false;
        }
    }

    async onGifUploaded(event: FileUploadEvent): Promise<void> {
        if (event.success && event.file) {
            this.gifArrayBuffer = await event.file.arrayBuffer();
        }
    }

    protected async handleMusicFile(event: FileUploadEvent): Promise<void> {
        if (event.success && event.file) {
            this.musicFile = event.file;
            this.audioUrl = URL.createObjectURL(event.file);
        } else {
            alert('Error uploading music file');
        }
    }
   
    handleSeekAdjustTime(time: number): void {
        this.currentTime = time;
    }

    async generateVideo() {
        if (!this.gifArrayBuffer || !this.musicFile) {
            return;
        }

        try {
            // Create a File object from the GIF ArrayBuffer
            const gifFile = new File([this.gifArrayBuffer], 'animation.gif', { type: 'image/gif' });
            

            this.generatingVideo = true;
            // Generate the video
            this.generatedVideoBlob = await this.generateGifService.generateGif(gifFile);
            this.generatingVideo = false;

            // Create a URL for the video and navigate to complete page
            const videoUrl = URL.createObjectURL(this.generatedVideoBlob);
            const encodedUrl = encodeURIComponent(videoUrl);
            this.router.navigate(['/complete', encodedUrl]);
        } catch (error) {
            console.error('Error generating video:', error);
            this.generatingVideo = false;
            // Handle error appropriately
        }
    }

    onVideoError(event: Event) {
        console.error('Error playing video:', event);
        // Handle video playback error
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
}

export class FileTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileTypeError';
    }
}