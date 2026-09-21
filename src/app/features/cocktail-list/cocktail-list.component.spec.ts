import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, BehaviorSubject } from 'rxjs';
import { CocktailListComponent } from './cocktail-list.component';
import { CocktailService } from '../../core/services/cocktail.service';
import { StateService } from '../../core/services/state.service';
import { ChangeDetectorRef } from '@angular/core';

describe('CocktailListComponent', () => {
  let component: CocktailListComponent;
  let fixture: ComponentFixture<CocktailListComponent>;
  let mockCocktailService: any;
  let mockStateService: any;

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
    component.searchType = 'ingredient';
    
    component.onSearchTypeChange();
    
    expect(component.searchTerm).toBe('');
    expect(mockCocktailService.searchLocal).toHaveBeenCalledWith('', 'ingredient');
  });

  it('debería aplicar el filtro de favoritos correctamente', () => {
    // Configuramos los mocks
    component.allCocktails = [
      { idDrink: '1', strDrink: 'A', strInstructions: '', strDrinkThumb: '', ingredients: [] },
      { idDrink: '2', strDrink: 'B', strInstructions: '', strDrinkThumb: '', ingredients: [] }
    ];
    component.favoritesSet = new Set(['1']); // Solo el ID 1 es favorito
    
    component.showOnlyFavorites = false;
    component.toggleFavoritesFilter(); // Cambia a true y ejecuta updateDisplayedCocktails
    
    expect(component.showOnlyFavorites).toBe(true);
    expect(component.filteredCocktails.length).toBe(1);
    expect(component.filteredCocktails[0].idDrink).toBe('1');
  });

  it('debería incrementar la página al llamar a loadMore', () => {
    vi.useFakeTimers();
    component.allCocktails = new Array(20).fill({ idDrink: '1' });
    component.currentPage = 1;
    // Forzamos que se vuelva a calcular la lista filtrada
    (component as any)._filteredDirty = true; 
    
    component.loadMore();
    vi.advanceTimersByTime(150); // Simulamos el setTimeout de 150ms
    
    expect(component.currentPage).toBe(2);
    expect(component.displayedCocktails.length).toBe(18); // pageSize es 9
  });

  it('debería emitir el término sanitizado al Subject de búsqueda', () => {
    vi.useFakeTimers();
    vi.spyOn(component as any, 'executeSearch');
    
    // Tipeamos algo con números en el filtro de nombre
    component.searchType = 'name';
    component.onSearchInput('Margarita123'); 
    
    // Debería sanitizar eliminando los números
    expect(component.searchTerm).toBe('Margarita');
    
    vi.advanceTimersByTime(250); // Simulamos el debounceTime de 250ms
    
    expect((component as any).executeSearch).toHaveBeenCalled();
  });
});



