import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/cocktail-list/cocktail-list.component').then(
        (m) => m.CocktailListComponent,
      ),
    title: 'Bar Manager - Listado',
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./features/cocktail-detail/cocktail-detail.component').then(
        (m) => m.CocktailDetailComponent,
      ),
    title: 'Bar Manager - Detalle',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
