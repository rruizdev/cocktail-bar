import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CocktailService } from '../../core/services/cocktail.service';
import { Cocktail } from '../../core/models/cocktail.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { StateService } from '../../core/services/state.service';

@Component({
  selector: 'app-cocktail-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss']
})
export class CocktailListComponent implements OnInit {
  cocktails: Cocktail[] = [];
  loading = false;
  errorMessage = '';

  // Filtros
  searchType: 'name' | 'ingredient' | 'id' = 'name';
  searchTerm = '';
  showOnlyFavorites = false;

  // Menú contextual activo por ID de trago
  activeMenuId: string | null = null;

  constructor(private cocktailService: CocktailService, private router: Router, private stateService: StateService) {}

  ngOnInit(): void {
    const savedState = this.stateService.getState();
    if (savedState.term) {
      this.searchTerm = savedState.term;
      this.searchType = savedState.type;
      this.showOnlyFavorites = savedState.onlyFavorites;
      this.searchCocktails(this.searchTerm);

      // Restaurar posición de Scroll en X,Y
      setTimeout(() => {
        window.scrollTo(savedState.scrollPosition[0], savedState.scrollPosition[1]);
      }, 100);
    } else {
      this.searchCocktails('a');
    }
  }

  onSearchChange(value: string): void {
    // Validaciones estrictas según el requerimiento del examen
    if (this.searchType === 'name') {
      // Solo caracteres alfabéticos (y espacios), máximo 50 caracteres
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
      this.searchTerm = sanitized;
    } else if (this.searchType === 'ingredient') {
      // Solo caracteres alfabéticos
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      this.searchTerm = sanitized;
    } else if (this.searchType === 'id') {
      // Solo caracteres numéricos
      const sanitized = value.replace(/[^0-9]/g, '');
      this.searchTerm = sanitized;
    }

    if (this.searchTerm.trim() === '') {
      this.cocktails = [];
      return;
    }

    this.searchCocktails(this.searchTerm);
  }

  searchCocktails(term: string): void {
    this.loading = true;
    this.errorMessage = '';

    let request$;
    if (this.searchType === 'name') {
      request$ = this.cocktailService.searchByName(term);
    } else if (this.searchType === 'ingredient') {
      request$ = this.cocktailService.searchByIngredient(term);
    } else {
      request$ = this.cocktailService.searchById(term);
    }

    request$.subscribe({
      next: (data) => {
        this.cocktails = data || [];
        this.loading = false;
        if (this.cocktails.length === 0) {
          this.errorMessage = 'No se encontraron cócteles con ese criterio.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Ocurrió un error al consultar la API.';
        console.error(err);
      }
    });
  }

  toggleFavorite(id: string, event: Event): void {
    event.stopPropagation();
    this.cocktailService.toggleFavorite(id);
  }

  isFavorite(id: string): boolean {
    return this.cocktailService.isFavorite(id);
  }

  get displayedCocktails(): Cocktail[] {
    if (this.showOnlyFavorites) {
      return this.cocktails.filter(c => this.isFavorite(c.idDrink));
    }
    return this.cocktails;
  }

  toggleContextMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  viewDetail(id: string): void {
    // Guardar el estado actual antes de navegar al detalle
    this.stateService.saveState(this.searchTerm, this.searchType, this.showOnlyFavorites);
    this.router.navigate(['/detail', id]);
  }

  trackByDrinkId(index: number, cocktail: Cocktail): string {
    return cocktail.idDrink;
  }
}
