import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CocktailService } from './cocktail.service';
import { environment } from '../../../environments/environment';

describe('CocktailService', () => {
  let service: CocktailService;
  let httpMock: HttpTestingController;
  let setItemSpy: any;

  beforeEach(() => {
    // Mockeamos BroadcastChannel a nivel global
    (window as any).BroadcastChannel = class {
      postMessage = vi.fn();
      onmessage = null;
    };

    // Limpiamos localStorage antes de cada test
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});


    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CocktailService]
    });

    service = TestBed.inject(CocktailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('debería crearse e inicializar el catálogo vacío', () => {
    expect(service).toBeTruthy();
    // Al instanciarse, llama a initCatalog que dispara un GET
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    expect(req.request.method).toBe('GET');
    req.flush({ drinks: [] });
  });

  it('debería agregar y quitar favoritos correctamente', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    // Agregamos un favorito
    service.toggleFavorite('11000');
    expect(service.isFavorite('11000')).toBe(true);
    expect(setItemSpy).toHaveBeenCalled();

    // Lo volvemos a tocar para quitarlo
    service.toggleFavorite('11000');
    expect(service.isFavorite('11000')).toBe(false);
  });


  it('debería realizar una búsqueda local si hay coincidencias', () => new Promise<void>((resolve) => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    // Simulamos que el catálogo inicial cargó un Mojito
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint' }]
    });

    service.searchLocal('mojito', 'name').subscribe(results => {
      expect(results.length).toBe(1);
      expect(results[0].strDrink).toBe('Mojito');
      resolve();
    });
  }));
});

