import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HttpStatusService {
  private platformId = inject(PLATFORM_ID);

  setStatus(statusCode: number): void {
    if (isPlatformServer(this.platformId)) {
      // On server side, we can set the status code
      // This will be handled by the server configuration
      console.log(`Setting HTTP status to ${statusCode} on server`);
      
      // Set a custom property on the global object that the server can detect
      if (typeof global !== 'undefined') {
        (global as any).__ANGULAR_HTTP_STATUS__ = statusCode;
      }
    }
  }

  set404Status(): void {
    this.setStatus(404);
  }
} 