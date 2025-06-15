import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FileUploadEvent, UploadComponent } from "src/app/upload.component";
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GifPlayerComponent } from "src/app/gif-player/gif-player.component";
import { GenerateGifService } from '../../services/generate-gif.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AudioPlayerComponent } from "../audio-player/audio-player.component";
import { ProgressIndicatorComponent } from "../progress-indicator.component";

@Component({
    selector: 'app-media-sync',
    imports: [CommonModule, UploadComponent, GifPlayerComponent, AudioPlayerComponent, ProgressIndicatorComponent],
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
    generatedVideoUrl: SafeUrl | null = null;
    private generatedVideoBlob: Blob | null = null;
    audioUrl: string | null = null;
    currentTime = 0;
    duration = 0;
    startBracketTime = 0;
    endBracketTime = 0;
    generatingVideo = false;

    constructor(
        private generateGifService: GenerateGifService,
        private sanitizer: DomSanitizer
    ) {}

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

            // Create a safe URL for the video
            this.generatedVideoUrl = this.sanitizer.bypassSecurityTrustUrl(
                URL.createObjectURL(this.generatedVideoBlob)
            );
        } catch (error) {
            console.error('Error generating video:', error);
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