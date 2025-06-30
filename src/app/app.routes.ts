import { Route } from '@angular/router';
import { MediaSyncComponent } from './pages/media-sync/media-sync.component';
import { CompleteComponent } from './pages/complete/complete.component';
import { FourohfourComponent } from './pages/404/fourohfour.component';
import { GifRouteService } from './services/gif-route.service';

export const appRoutes: Route[] = [
    { path: '', component: MediaSyncComponent },
    { path: 'complete', component: CompleteComponent },
    { path: 'complete/:videoUrl', component: CompleteComponent },
    // Add dynamic routes from service
    ...GifRouteService.getDynamicRoutes(),
    { 
      path: '**', 
      component: FourohfourComponent,
      data: { 
        title: 'Page Not Found',
        status: 404
      }
    },
];
