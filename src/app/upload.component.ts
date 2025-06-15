import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

export interface FileUploadEvent {
  success: boolean;
  file?: File;
  error?: string;
}

export type UploadMode = 'button' | 'drag-drop';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  fileUploaded = output<FileUploadEvent>();
  fileType = input<string>('image/*');
  mode = input<UploadMode>('drag-drop');
  id = input<string>('file-input');
  
  protected dragging = false;

  onDragOver(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = true;
  }

  onDragLeave(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  private handleFiles(files: FileList) {
    try {
      const file = files[0];
      this.fileUploaded.emit({ success: true, file });
    } catch (error) {
      this.fileUploaded.emit({ success: false, error: 'Failed to upload file' });
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files != null) {
      this.handleFiles(files);
    }
  }
}
