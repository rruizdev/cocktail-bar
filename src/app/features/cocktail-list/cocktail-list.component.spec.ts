import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CocktailListComponent } from './cocktail-list.component';
import { CocktailService } from '../../core/services/cocktail.service';
import { StateService } from '../../core/services/state.service';
import { ChangeDetectorRef } from '@angular/core';

describe('CocktailListComponent', () => {
  let component: CocktailListComponent;
  let fixture: ComponentFixture<CocktailListComponent>;
  let mockCocktailService: any;
  let mockStateService: any;
  let router: Router;

  beforeEach(async () => {
    const catalogSub = new BehaviorSubject<any[]>([]);
    const favoritesSub = new BehaviorSubject<string[]>([]);

    mockCocktailService = {
      catalog$: catalogSub.asObservable(),
      favorites$: favoritesSub.asObservable(),
      searchLocal: vi.fn().mockReturnValue(of([
        { idDrink: '1', strDrink: 'A' },
        { idDrink: '2', strDrink: 'B' }
      ])),
      toggleFavorite: vi.fn()
    };

    mockStateService = {
      getState: vi.fn().mockReturnValue({
        term: '', type: 'name', onlyFavorites: false, scrollPosition: [0, 0]
      }),
      saveState: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CocktailListComponent, RouterTestingModule],
      providers: [
        { provide: CocktailService, useValue: mockCocktailService },
        { provide: StateService, useValue: mockStateService },
        ChangeDetectorRef
      ]
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
    component.searchTerm = 'test';
    
    component.onSearchTypeChange('ingredient');
    
    expect(component.searchTerm).toBe('');
    expect(mockCocktailService.searchLocal).toHaveBeenCalledWith('', 'ingredient');
  });

  it('debería aplicar el filtro de favoritos correctamente', () => {
    component.allCocktails = [
      { idDrink: '1', strDrink: 'A', strInstructions: '', strDrinkThumb: '', ingredients: [] },
      { idDrink: '2', strDrink: 'B', strInstructions: '', strDrinkThumb: '', ingredients: [] }
    ];
    component.favoritesSet = new Set(['1']);
    
    component.showOnlyFavorites = false;
    component.toggleFavoritesFilter();
    
    expect(component.showOnlyFavorites).toBe(true);
    expect(component.filteredCocktails.length).toBe(1);
    expect(component.filteredCocktails[0].idDrink).toBe('1');
  });

  it('debería incrementar la página al llamar a loadMore', () => {
    vi.useFakeTimers();
    component.allCocktails = new Array(20).fill({ idDrink: '1' });
    component.currentPage = 1;
    (component as any)._filteredDirty = true; 
    
    component.loadMore();
    vi.advanceTimersByTime(150);
    
    expect(component.currentPage).toBe(2);
    expect(component.displayedCocktails.length).toBe(18);
  });

  it('debería emitir el término sanitizado al Subject de búsqueda', () => {
    vi.useFakeTimers();
    vi.spyOn(component as any, 'executeSearch');
    
    component.searchType = 'name';
    component.onSearchInput('Margarita123'); 
    
    expect(component.searchTerm).toBe('Margarita');
    
    vi.advanceTimersByTime(250);
    
    expect((component as any).executeSearch).toHaveBeenCalled();
  });

  it('debería sanitizar búsqueda de ID sólo permitiendo números', () => {
    component.searchType = 'id';
    component.onSearchInput('abc11007xyz');
    expect(component.searchTerm).toBe('11007');
  });

  it('debería navegar a detalles al seleccionar un cóctel', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.viewDetail('11007');

    expect(mockStateService.saveState).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', '11007']);
  });

  it('debería alternar el menú contextual', () => {
    expect(component.activeMenuId).toBeNull();
    component.toggleContextMenu('11007');
    expect(component.activeMenuId).toBe('11007');
    component.toggleContextMenu('11007');
    expect(component.activeMenuId).toBeNull();
  });

  it('debería mostrar mensaje de error si searchLocal falla', () => {
    mockCocktailService.searchLocal.mockReturnValue(throwError(() => new Error('Search failed')));
    component.executeSearch();

    expect(component.errorMessage).toBe('Ocurrió un error al procesar la búsqueda.');
    expect(component.allCocktails.length).toBe(0);
  });
});
