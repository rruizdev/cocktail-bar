import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { CocktailDetailComponent } from './cocktail-detail.component';
import { CocktailService } from '@core/services/cocktail.service';
import { Cocktail } from '@core/models/cocktail.model';
import { SearchType } from '@core/models/search-type.model';

interface MockCocktailService {
  searchLocal: ReturnType<typeof vi.fn<(term: string, type: SearchType) => Cocktail[]>>;
  favorites$: Observable<string[]>;
  toggleFavorite: ReturnType<typeof vi.fn>;
}

describe('CocktailDetailComponent', () => {
  let component: CocktailDetailComponent;
  let fixture: ComponentFixture<CocktailDetailComponent>;
  let mockCocktailService: MockCocktailService;
  let router: Router;

  beforeEach(async () => {
    mockCocktailService = {
      searchLocal: vi.fn<(term: string, type: SearchType) => Cocktail[]>().mockReturnValue([
        {
          idDrink: '11000',
          strDrink: 'Mojito',
          strInstructions: 'Muddle mint.',
          strDrinkThumb: '',
          ingredients: [{ name: 'Mint', measure: '1 oz' }],
        },
      ]),
      favorites$: new BehaviorSubject<string[]>(['11000']).asObservable(),
      toggleFavorite: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CocktailDetailComponent, RouterTestingModule],
      providers: [
        { provide: CocktailService, useValue: mockCocktailService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '11000' } } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CocktailDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería cargar los detalles del cóctel al iniciar', () => {
    expect(component.cocktail()).toBeTruthy();
    expect(component.cocktail()?.strDrink).toBe('Mojito');
    expect(component.loading()).toBe(false);
    expect(mockCocktailService.searchLocal).toHaveBeenCalledWith('11000', 'id');
  });

  it('debería alternar favoritos', () => {
    component.toggleFavorite();
    expect(mockCocktailService.toggleFavorite).toHaveBeenCalledWith('11000');
  });

  it('debería verificar si es favorito según el estado de favoritos', () => {
    expect(component.isFavorite()).toBe(true);
  });

  it('debería navegar hacia atrás con goBack', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goBack();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
