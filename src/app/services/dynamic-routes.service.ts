import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { MediaSyncComponent } from '../pages/media-sync/media-sync.component';
import { CompleteComponent } from '../pages/complete/complete.component';
import { FourohfourComponent } from '../pages/404/fourohfour.component';

export interface DynamicRouteItem {
  path: string;
  component: any;
  data?: any;
  children?: Route[];
}

@Injectable({
  providedIn: 'root'
})
export class DynamicRoutesService {
  private dynamicRoutes: DynamicRouteItem[] = [
    {
      path: 'gif/:id',
      component: CompleteComponent,
      data: { type: 'gif' }
    },
    {
      path: 'video/:id',
      component: CompleteComponent,
      data: { type: 'video' }
    },
    {
      path: 'project/:projectId',
      component: MediaSyncComponent,
      data: { type: 'project' }
    }
  ];

  /**
   * Get all dynamic routes
   */
  getDynamicRoutes(): Route[] {
    return this.dynamicRoutes.map(item => ({
      path: item.path,
      component: item.component,
      data: item.data,
      children: item.children
    }));
  }

  /**
   * Add a new dynamic route
   */
  addDynamicRoute(route: DynamicRouteItem): void {
    this.dynamicRoutes.push(route);
  }

  /**
   * Remove a dynamic route by path
   */
  removeDynamicRoute(path: string): void {
    this.dynamicRoutes = this.dynamicRoutes.filter(route => route.path !== path);
  }

  /**
   * Get routes based on a list of items
   */
  getRoutesFromItems<T>(items: T[], pathTemplate: string, component: any, dataExtractor?: (item: T) => any): Route[] {
    return items.map(item => ({
      path: this.interpolatePath(pathTemplate, item),
      component: component,
      data: dataExtractor ? dataExtractor(item) : { item }
    }));
  }

  /**
   * Interpolate path template with item data
   */
  private interpolatePath(template: string, item: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return item[key] || match;
    });
  }

  /**
   * Check if a path matches any dynamic route
   */
  isDynamicRoute(path: string): boolean {
    return this.dynamicRoutes.some(route => {
      const routePath = route.path.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${routePath}$`);
      return regex.test(path);
    });
  }
} 