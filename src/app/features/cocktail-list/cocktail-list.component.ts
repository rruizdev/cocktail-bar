import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CocktailService } from '../../core/services/cocktail.service';
import { StateService } from '../../core/services/state.service';
import { Cocktail } from '../../core/models/cocktail.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cocktail-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss']
})
export class CocktailListComponent implements OnInit, OnDestroy {
  allCocktails: Cocktail[] = [];
  displayedCocktails: Cocktail[] = [];
  
  loading = false;
  loadingMore = false;
  errorMessage = '';

  pageSize = 9;
  currentPage = 1;

  searchType: 'name' | 'ingredient' | 'id' = 'name';
  searchTerm = '';
  showOnlyFavorites = false;
  activeMenuId: string | null = null;

  private catalogSub!: Subscription;
  private favoritesSub!: Subscription;

  constructor(
    private cocktailService: CocktailService, 
    private router: Router,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    // Sincronización continua de catálogo y favoritos entre pestañas
    this.catalogSub = this.cocktailService.catalog$.subscribe(() => {
      this.executeSearch();
    });

    this.favoritesSub = this.cocktailService.favorites$.subscribe(() => {
      this.updateDisplayedCocktails();
    });

    const savedState = this.stateService.getState();
    if (savedState.term) {
      this.searchTerm = savedState.term;
      this.searchType = savedState.type;
      this.showOnlyFavorites = savedState.onlyFavorites;
      this.executeSearch(true, savedState.scrollPosition);
    }
  }

  ngOnDestroy(): void {
    if (this.catalogSub) this.catalogSub.unsubscribe();
    if (this.favoritesSub) this.favoritesSub.unsubscribe();
  }

  onSearchInput(value: string): void {
    if (this.searchType === 'name') {
      this.searchTerm = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    } else if (this.searchType === 'ingredient') {
      this.searchTerm = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (this.searchType === 'id') {
      this.searchTerm = value.replace(/[^0-9]/g, '');
    }

    this.executeSearch();
  }

  executeSearch(isRestoring = false, savedScroll: [number, number] = [0, 0]): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;

    this.cocktailService.searchLocal(this.searchTerm, this.searchType).subscribe({
      next: (data) => {
        this.allCocktails = data || [];
        this.updateDisplayedCocktails();
        this.loading = false;

        if (this.allCocktails.length === 0) {
          this.errorMessage = 'No se encontraron cócteles guardados localmente.';
        }

        if (isRestoring) {
          setTimeout(() => {
            window.scrollTo(savedScroll[0], savedScroll[1]);
          }, 100);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error al procesar la búsqueda local.';
      }
    });
  }

  loadMore(): void {
    if (this.loadingMore || this.displayedCocktails.length >= this.filteredCocktails.length) return;

    this.loadingMore = true;
    setTimeout(() => {
      this.currentPage++;
      this.updateDisplayedCocktails();
      this.loadingMore = false;
    }, 150);
  }

  private updateDisplayedCocktails(): void {
    const sourceList = this.filteredCocktails;
    const limit = this.currentPage * this.pageSize;
    this.displayedCocktails = sourceList.slice(0, limit);
  }

  get filteredCocktails(): Cocktail[] {
    if (this.showOnlyFavorites) {
      return this.allCocktails.filter(c => this.isFavorite(c.idDrink));
    }
    return this.allCocktails;
  }

  toggleFavoritesFilter(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.currentPage = 1;
    this.updateDisplayedCocktails();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight - 100;

    if (pos >= max) {
      this.loadMore();
    }
  }

  toggleFavorite(id: string, event: Event): void {
    event.stopPropagation();
    this.cocktailService.toggleFavorite(id);
  }

  isFavorite(id: string): boolean {
    return this.cocktailService.isFavorite(id);
  }

  toggleContextMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  viewDetail(id: string): void {
    this.stateService.saveState(this.searchTerm, this.searchType, this.showOnlyFavorites);
    this.router.navigate(['/detail', id]);
  }

  trackByDrinkId(index: number, cocktail: Cocktail): string {
    return cocktail.idDrink;
  }
}
