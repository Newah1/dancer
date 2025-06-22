import { Route } from '@angular/router';
import { MediaSyncComponent } from './components/media-sync/media-sync.component';
import { CompleteComponent } from './pages/complete.component';
import { FourohfourComponent } from './pages/fourohfour.component';

export const appRoutes: Route[] = [
    { path: '', component: MediaSyncComponent },
    { path: 'complete', component: CompleteComponent },
    { path: 'complete/:videoUrl', component: CompleteComponent },
    { 
      path: '**', 
      component: FourohfourComponent,
      data: { 
        title: 'Page Not Found',
        status: 404
      }
    },
];
