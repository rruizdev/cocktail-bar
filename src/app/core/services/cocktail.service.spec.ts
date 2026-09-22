import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CocktailService } from './cocktail.service';
import { environment } from '../../../environments/environment';

describe('CocktailService', () => {
  let service: CocktailService;
  let httpMock: HttpTestingController;
  let setItemSpy: any;

  beforeEach(() => {
    (window as any).BroadcastChannel = class {
      postMessage = vi.fn();
      onmessage = null;
    };

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
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    expect(req.request.method).toBe('GET');
    req.flush({ drinks: [] });
  });

  it('debería agregar y quitar favoritos correctamente', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    service.toggleFavorite('11000');
    expect(service.isFavorite('11000')).toBe(true);
    expect(setItemSpy).toHaveBeenCalled();

    service.toggleFavorite('11000');
    expect(service.isFavorite('11000')).toBe(false);
  });

  it('debería realizar una búsqueda local por nombre si hay coincidencias', () => new Promise<void>((resolve) => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint' }]
    });

    service.searchLocal('mojito', 'name').subscribe(results => {
      expect(results.length).toBe(1);
      expect(results[0].strDrink).toBe('Mojito');
      resolve();
    });
  }));

  it('debería realizar una búsqueda local por ingrediente', () => new Promise<void>((resolve) => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint', strMeasure1: '2 leaves' }]
    });

    service.searchLocal('mint', 'ingredient').subscribe(results => {
      expect(results.length).toBe(1);
      expect(results[0].strDrink).toBe('Mojito');
      resolve();
    });
  }));

  it('debería realizar una búsqueda local por ID', () => new Promise<void>((resolve) => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint' }]
    });

    service.searchLocal('11000', 'id').subscribe(results => {
      expect(results.length).toBe(1);
      expect(results[0].idDrink).toBe('11000');
      resolve();
    });
  }));

  it('debería devolver todo el catálogo si el término de búsqueda está vacío', () => new Promise<void>((resolve) => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito' }]
    });

    service.searchLocal('   ', 'name').subscribe(results => {
      expect(results.length).toBe(1);
      resolve();
    });
  }));

  it('debería manejar la expiración por TTL del catálogo almacenado', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    const expiredData = JSON.stringify({
      storedAt: Date.now() - (25 * 60 * 60 * 1000),
      cocktails: [{ idDrink: '99999', strDrink: 'Old Cocktail' }]
    });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(expiredData);
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    // Invocamos el método privado de carga pasando por el almacenamiento expirado
    const loaded = (service as any).loadCatalogFromStorage();
    expect(loaded).toEqual([]);
    expect(removeItemSpy).toHaveBeenCalledWith('coto_cocktails_catalog');
  });

  it('debería deserializar el formato legacy si el JSON es una lista', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    const legacyData = JSON.stringify([{ idDrink: '88888', strDrink: 'Legacy Drink', ingredients: [] }]);
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(legacyData);

    const loaded = (service as any).loadCatalogFromStorage();
    expect(loaded.length).toBe(1);
    expect(loaded[0].strDrink).toBe('Legacy Drink');
  });
});
