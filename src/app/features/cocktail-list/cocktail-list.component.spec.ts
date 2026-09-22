import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { CocktailListComponent } from './cocktail-list.component';
import { CocktailService } from '@core/services/cocktail.service';
import { StateService } from '@core/services/state.service';
import { Cocktail } from '@core/models/cocktail.model';
import { SearchType } from '@core/models/search-type.model';
import { SearchState } from '@core/models/search.model';

interface MockCocktailService {
  catalog$: Observable<Cocktail[]>;
  favorites$: Observable<string[]>;
  searchLocal: ReturnType<typeof vi.fn<(term: string, type: SearchType) => Cocktail[]>>;
  toggleFavorite: ReturnType<typeof vi.fn>;
}

interface MockStateService {
  getState: ReturnType<typeof vi.fn<() => SearchState>>;
  saveState: ReturnType<typeof vi.fn>;
}

describe('CocktailListComponent', () => {
  let component: CocktailListComponent;
  let fixture: ComponentFixture<CocktailListComponent>;
  let mockCocktailService: MockCocktailService;
  let mockStateService: MockStateService;
  let router: Router;

  beforeEach(async () => {
    const catalogSub = new BehaviorSubject<Cocktail[]>([]);
    const favoritesSub = new BehaviorSubject<string[]>([]);

    mockCocktailService = {
      catalog$: catalogSub.asObservable(),
      favorites$: favoritesSub.asObservable(),
      searchLocal: vi.fn<(term: string, type: SearchType) => Cocktail[]>().mockReturnValue([
        { idDrink: '1', strDrink: 'A', strInstructions: '', strDrinkThumb: '', ingredients: [] },
        { idDrink: '2', strDrink: 'B', strInstructions: '', strDrinkThumb: '', ingredients: [] },
      ]),
      toggleFavorite: vi.fn(),
    };

    mockStateService = {
      getState: vi.fn<() => SearchState>().mockReturnValue({
        term: '',
        type: 'name',
        onlyFavorites: false,
      }),
      saveState: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CocktailListComponent, RouterTestingModule],
      providers: [
        { provide: CocktailService, useValue: mockCocktailService },
        { provide: StateService, useValue: mockStateService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CocktailListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debería limpiar el término de búsqueda al cambiar el tipo de filtro', () => {
    component.searchTerm.set('test');

    component.onSearchTypeChange('ingredient');

    expect(component.searchTerm()).toBe('');
    expect(mockCocktailService.searchLocal).toHaveBeenCalledWith('', 'ingredient');
  });

  it('debería aplicar el filtro de favoritos correctamente', () => {
    component.allCocktails.set([
      { idDrink: '1', strDrink: 'A', strInstructions: '', strDrinkThumb: '', ingredients: [] },
      { idDrink: '2', strDrink: 'B', strInstructions: '', strDrinkThumb: '', ingredients: [] },
    ]);
    component.favoritesSet.set(new Set(['1']));

    component.showOnlyFavorites.set(false);
    component.toggleFavoritesFilter();

    expect(component.showOnlyFavorites()).toBe(true);
    expect(component.filteredCocktails().length).toBe(1);
    expect(component.filteredCocktails()[0].idDrink).toBe('1');
  });

  it('debería incrementar la página al llamar a loadMore', () => {
    const template: Cocktail = {
      idDrink: '1',
      strDrink: 'A',
      strInstructions: '',
      strDrinkThumb: '',
      ingredients: [],
    };
    component.allCocktails.set(new Array(20).fill(template));
    component.currentPage.set(1);

    component.loadMore();

    expect(component.currentPage()).toBe(2);
    expect(component.displayedCocktails().length).toBe(18);
  });

  it('debería emitir el término sanitizado al Subject de búsqueda', () => {
    vi.useFakeTimers();
    const executeSpy = vi.spyOn(component as unknown as { executeSearch(): void }, 'executeSearch');

    component.searchType.set('name');
    component.onSearchInput('Margarita123');

    expect(component.searchTerm()).toBe('Margarita');

    vi.advanceTimersByTime(250);

    expect(executeSpy).toHaveBeenCalled();
  });

  it('debería sanitizar búsqueda de ID sólo permitiendo números', () => {
    component.searchType.set('id');
    component.onSearchInput('abc11007xyz');
    expect(component.searchTerm()).toBe('11007');
  });

  it('debería navegar a detalles al seleccionar un cóctel', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.viewDetail('11007');

    expect(mockStateService.saveState).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', '11007']);
  });

  it('debería alternar el menú contextual', () => {
    expect(component.activeMenuId()).toBeNull();
    component.toggleContextMenu('11007');
    expect(component.activeMenuId()).toBe('11007');
    component.toggleContextMenu('11007');
    expect(component.activeMenuId()).toBeNull();
  });
});
