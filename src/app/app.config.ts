import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // Restaura automáticamente la posición X,Y al volver atrás
        anchorScrolling: 'enabled'
    }))
  ]
};
