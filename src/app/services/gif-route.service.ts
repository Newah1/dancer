import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { MediaSyncComponent } from '../pages/media-sync/media-sync.component';

export interface GifDynamicRoute {
  path: string;
  component: any;
  data?: any;
  children?: Route[];
}

@Injectable({
  providedIn: 'root'
})
export class GifRouteService {

  private static DynamicRoutes: GifDynamicRoute[] = [
    {
      path: 'spongebob-dance',
      component: MediaSyncComponent,
      data: { url: 'gifs/spongebob_dance.gif', seoTitle: 'SpongeBob Dance Gif / Music Generator', seoDescription: 'SpongeBob Dance is a fun and easy way to create a synchronized video of SpongeBob dancing to music.', seoKeywords: 'spongebob, dance, video, music, synchronized' }
    }
  ];

  static getDynamicRoutes(): Route[] {
    return GifRouteService.DynamicRoutes.map(route => ({
      path: route.path,
      component: route.component,
      data: route.data
    }));
  }
}
