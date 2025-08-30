import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter,RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './route-strategy/costum-reuse-strategy';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(),  { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }]
};
