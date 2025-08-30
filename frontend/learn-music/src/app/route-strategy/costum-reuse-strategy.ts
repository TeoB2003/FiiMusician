import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomReuseStrategy implements RouteReuseStrategy {

  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Doar ruta "invata" va fi salvată
    return route.routeConfig?.path === 'invata';
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (route.routeConfig?.path) {
      this.storedRoutes.set(route.routeConfig.path, handle!);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig?.path && this.storedRoutes.has(route.routeConfig.path);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig?.path) return null;
    return this.storedRoutes.get(route.routeConfig.path) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
