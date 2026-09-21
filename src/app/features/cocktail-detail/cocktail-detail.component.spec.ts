import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { CocktailDetailComponent } from './cocktail-detail.component';
import { CocktailService } from '../../core/services/cocktail.service';

describe('CocktailDetailComponent', () => {
  let component: CocktailDetailComponent;
  let fixture: ComponentFixture<CocktailDetailComponent>;
  let mockCocktailService: any;

  beforeEach(async () => {
    mockCocktailService = {
      searchLocal: vi.fn().mockReturnValue(of([{
        idDrink: '11000',
        strDrink: 'Mojito',
        strInstructions: 'Muddle mint.',
        ingredients: [{ name: 'Mint', measure: '1 oz' }]
      }])),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [CocktailDetailComponent, RouterTestingModule],
      providers: [
        { provide: CocktailService, useValue: mockCocktailService },
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '11000' } } } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería cargar los detalles del cóctel al iniciar', () => {
    expect(component.cocktail).toBeTruthy();
    expect(component.cocktail?.strDrink).toBe('Mojito');
    expect(component.loading).toBe(false);
    expect(mockCocktailService.searchLocal).toHaveBeenCalledWith('11000', 'id');
  });

  it('debería alternar favoritos', () => {
    component.toggleFavorite();
    expect(mockCocktailService.toggleFavorite).toHaveBeenCalledWith('11000');
  });

  it('debería verificar si es favorito', () => {
    const isFav = component.isFavorite();
    expect(isFav).toBe(true);
    expect(mockCocktailService.isFavorite).toHaveBeenCalledWith('11000');
  });
});

