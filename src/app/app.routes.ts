import { Routes } from '@angular/router';
import { CocktailListComponent } from './features/cocktail-list/cocktail-list.component';
import { CocktailDetailComponent } from './features/cocktail-detail/cocktail-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: CocktailListComponent,
    title: 'Bar Manager - Listado'
  },
  {
    path: 'detail/:id',
    component: CocktailDetailComponent,
    title: 'Bar Manager - Detalle'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
