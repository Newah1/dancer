import { Route } from '@angular/router';
import { MediaSyncComponent } from './components/media-sync/media-sync.component';

export const appRoutes: Route[] = [
    { path: '', component: MediaSyncComponent },
    { path: 'test', component: MediaSyncComponent },
];
