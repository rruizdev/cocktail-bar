import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CocktailService } from '@core/services/cocktail.service';
import { StateService } from '@core/services/state.service';
import { Cocktail } from '@core/models/cocktail.model';
import { SearchType } from '@core/models/search-type.model';
import { CocktailCardComponent } from '@shared/components/cocktail-card/cocktail-card.component';
import { CocktailSearchComponent } from '@shared/components/cocktail-search/cocktail-search.component';

@Component({
  selector: 'app-cocktail-list',
  standalone: true,
  imports: [CocktailCardComponent, CocktailSearchComponent],
  templateUrl: './cocktail-list.component.html',
  styleUrls: ['./cocktail-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CocktailListComponent implements OnInit {
  readonly pageSize = 9;

  readonly searchType = signal<SearchType>('name');
  readonly searchTerm = signal('');
  readonly showOnlyFavorites = signal(false);
  readonly currentPage = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly allCocktails = signal<Cocktail[]>([]);
  readonly favoritesSet = signal<Set<string>>(new Set());
  readonly activeMenuId = signal<string | null>(null);
  readonly navigatingId = signal<string | null>(null);

  readonly filteredCocktails = computed<Cocktail[]>(() => {
    const all = this.allCocktails();
    if (!this.showOnlyFavorites()) return all;
    const favorites = this.favoritesSet();
    return all.filter((c) => favorites.has(c.idDrink));
  });

  readonly displayedCocktails = computed<Cocktail[]>(() =>
    this.filteredCocktails().slice(0, this.currentPage() * this.pageSize),
  );

  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly cocktailService = inject(CocktailService);
  private readonly router = inject(Router);
  private readonly stateService = inject(StateService);

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.executeSearch());

    this.cocktailService.catalog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.executeSearch());

    this.cocktailService.favorites$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((favs) => this.favoritesSet.set(new Set(favs)));

    fromEvent(window, 'scroll')
      .pipe(
        throttleTime(100, undefined, { leading: true, trailing: true }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.onWindowScroll());

    const saved = this.stateService.getState();
    if (saved.term) {
      this.searchTerm.set(saved.term);
      this.searchType.set(saved.type);
      this.showOnlyFavorites.set(saved.onlyFavorites);
      this.executeSearch();
    }
  }

  onSearchInput(value: string): void {
    const sanitized =
      this.searchType() === 'id' ? value.replace(/[^0-9]/g, '') : value.replace(/[^a-zA-Z\s]/g, '');

    this.searchTerm.set(this.searchType() === 'name' ? sanitized.slice(0, 50) : sanitized);
    this.searchSubject.next(this.searchTerm());
  }

  executeSearch(): void {
    this.loading.set(true);
    const results = this.cocktailService.searchLocal(this.searchTerm(), this.searchType());
    this.allCocktails.set(results);
    this.currentPage.set(1);
    this.loading.set(false);
    this.errorMessage.set(
      results.length === 0 && this.searchTerm().trim() !== ''
        ? 'No se encontraron cócteles que coincidan con la búsqueda.'
        : '',
    );
  }

  loadMore(): void {
    if (this.displayedCocktails().length >= this.filteredCocktails().length) return;

    this.currentPage.update((page) => page + 1);
  }

  toggleFavoritesFilter(): void {
    this.showOnlyFavorites.update((value) => !value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.executeSearch();
  }

  onWindowScroll(): void {
    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    if (pos >= document.documentElement.scrollHeight - 100) {
      this.loadMore();
    }
  }

  toggleFavorite(id: string): void {
    this.cocktailService.toggleFavorite(id);
  }

  toggleContextMenu(id: string): void {
    this.activeMenuId.set(this.activeMenuId() === id ? null : id);
  }

  viewDetail(id: string): void {
    this.navigatingId.set(id);
    this.stateService.saveState(this.searchTerm(), this.searchType(), this.showOnlyFavorites());
    this.router.navigate(['/detail', id]);
  }

  onSearchTypeChange(type: SearchType): void {
    this.searchType.set(type);
    this.searchTerm.set('');
    this.executeSearch();
  }
}
