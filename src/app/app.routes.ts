import { Route } from '@angular/router';
import { MediaSyncComponent } from './components/media-sync/media-sync.component';
import { CompleteComponent } from './pages/complete.component';

export const appRoutes: Route[] = [
    { path: '', component: MediaSyncComponent },
    { path: 'test', component: MediaSyncComponent },
    { path: 'complete', component: CompleteComponent },
    { path: 'complete/:videoUrl', component: CompleteComponent },
];
