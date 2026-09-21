import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';
import { CocktailService } from '../../core/services/cocktail.service';
import { StateService } from '../../core/services/state.service';
import { Cocktail } from '../../core/models/cocktail.model';
import { SearchType } from "../../core/models/search-type.model";
import { CocktailCardComponent } from '../../shared/components/cocktail-card/cocktail-card.component';
import { CocktailSearchComponent } from '../../shared/components/cocktail-search/cocktail-search.component';

@Component({
  selector: 'app-cocktail-list',
  standalone: true,
  imports: [CommonModule, CocktailCardComponent, CocktailSearchComponent],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CocktailListComponent implements OnInit, OnDestroy {
  allCocktails: Cocktail[] = [];
  displayedCocktails: Cocktail[] = [];

  loading = false;
  loadingMore = false;
  errorMessage = '';

  pageSize = 9;
  currentPage = 1;

  searchType: SearchType = 'name';
  searchTerm = '';
  showOnlyFavorites = false;
  activeMenuId: string | null = null;

  favoritesSet = new Set<string>();

  private _filteredCocktails: Cocktail[] = [];
  private _filteredDirty = true;

  private searchSubject = new Subject<string>();

  private catalogSub!: Subscription;
  private favoritesSub!: Subscription;
  private searchSub!: Subscription;
  private scrollSub!: Subscription;

  constructor(
    private cocktailService: CocktailService,
    private router: Router,
    private stateService: StateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(() => this.executeSearch());

    this.catalogSub = this.cocktailService.catalog$.subscribe(() => {
      this._filteredDirty = true;
      this.executeSearch();
    });

    this.favoritesSub = this.cocktailService.favorites$.subscribe(favs => {
      this.favoritesSet = new Set(favs);
      this._filteredDirty = true;
      this.updateDisplayedCocktails();
      this.cdr.markForCheck();
    });

    this.scrollSub = fromEvent(window, 'scroll').pipe(
      throttleTime(100, undefined, { leading: true, trailing: true })
    ).subscribe(() => this.onWindowScroll());

    const savedState = this.stateService.getState();
    if (savedState.term) {
      this.searchTerm = savedState.term;
      this.searchType = savedState.type;
      this.showOnlyFavorites = savedState.onlyFavorites;
      this.executeSearch();
    }
  }

  ngOnDestroy(): void {
    this.catalogSub?.unsubscribe();
    this.favoritesSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.scrollSub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    if (this.searchType === 'name') {
      this.searchTerm = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    } else if (this.searchType === 'ingredient') {
      this.searchTerm = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (this.searchType === 'id') {
      this.searchTerm = value.replace(/[^0-9]/g, '');
    }

    this.searchSubject.next(this.searchTerm);
  }

  executeSearch(): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    this._filteredDirty = true;

    this.cocktailService.searchLocal(this.searchTerm, this.searchType).subscribe({
      next: (data) => {
        this.allCocktails = data ?? [];
        this._filteredDirty = true;
        this.updateDisplayedCocktails();
        this.loading = false;

        if (this.allCocktails.length === 0 && this.searchTerm.trim() !== '') {
          this.errorMessage = 'No se encontraron cócteles que coincidan con la búsqueda.';
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.allCocktails = [];
        this._filteredDirty = true;
        this.updateDisplayedCocktails();
        this.errorMessage = 'Ocurrió un error al procesar la búsqueda.';
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    }, 150);
  }

  private updateDisplayedCocktails(): void {
    const limit = this.currentPage * this.pageSize;
    this.displayedCocktails = this.filteredCocktails.slice(0, limit);
  }

  get filteredCocktails(): Cocktail[] {
    if (this._filteredDirty) {
      this._filteredCocktails = this.showOnlyFavorites
        ? this.allCocktails.filter(c => this.favoritesSet.has(c.idDrink))
        : this.allCocktails;
      this._filteredDirty = false;
    }
    return this._filteredCocktails;
  }

  toggleFavoritesFilter(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.currentPage = 1;
    this._filteredDirty = true;
    this.updateDisplayedCocktails();
    this.cdr.markForCheck();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.executeSearch();
  }

  onWindowScroll(): void {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight - 100;
    if (pos >= max) {
      this.loadMore();
    }
  }

  toggleFavorite(id: string): void {
    this.cocktailService.toggleFavorite(id);
  }

  toggleContextMenu(id: string): void {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  navigatingId: string | null = null;

  viewDetail(id: string): void {
    this.navigatingId = id;
    this.cdr.markForCheck();
    this.stateService.saveState(this.searchTerm, this.searchType, this.showOnlyFavorites);
    this.router.navigate(['/detail', id]);
  }

  trackByDrinkId(_index: number, cocktail: Cocktail): string {
    return cocktail.idDrink;
  }

  onSearchTypeChange(type: SearchType): void {
    this.searchType = type;
    this.searchTerm = '';
    this.executeSearch();
  }
}
