import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CocktailService } from './cocktail.service';
import { environment } from '../../../environments/environment';

class BroadcastChannelStub {
  static instances: BroadcastChannelStub[] = [];
  postMessage = vi.fn();
  onmessage: ((event: { data: Record<string, unknown> }) => void) | null = null;

  constructor() {
    BroadcastChannelStub.instances.push(this);
  }
}

describe('CocktailService', () => {
  let service: CocktailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    BroadcastChannelStub.instances = [];
    (window as unknown as { BroadcastChannel: unknown }).BroadcastChannel = BroadcastChannelStub;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CocktailService],
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

    service.toggleFavorite('11000');
    expect(service.isFavorite('11000')).toBe(false);
  });

  it('no debería persistir nada en web storage', () => {
    const localSet = vi.spyOn(Storage.prototype, 'setItem');
    const localGet = vi.spyOn(Storage.prototype, 'getItem');
    const localRemove = vi.spyOn(Storage.prototype, 'removeItem');

    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [{ idDrink: '11000', strDrink: 'Mojito' }] });

    service.toggleFavorite('11000');
    service.searchLocal('mojito', 'name');

    expect(localSet).not.toHaveBeenCalled();
    expect(localGet).not.toHaveBeenCalled();
    expect(localRemove).not.toHaveBeenCalled();
  });

  it('debería realizar una búsqueda local por nombre si hay coincidencias', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint' }],
    });

    const results = service.searchLocal('mojito', 'name');
    expect(results.length).toBe(1);
    expect(results[0].strDrink).toBe('Mojito');
  });

  it('debería realizar una búsqueda local por ingrediente', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [
        { idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint', strMeasure1: '2 leaves' },
      ],
    });

    const results = service.searchLocal('mint', 'ingredient');
    expect(results.length).toBe(1);
    expect(results[0].strDrink).toBe('Mojito');
  });

  it('debería realizar una búsqueda local por ID', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito', strIngredient1: 'Mint' }],
    });

    const results = service.searchLocal('11000', 'id');
    expect(results.length).toBe(1);
    expect(results[0].idDrink).toBe('11000');
  });

  it('debería devolver todo el catálogo si el término de búsqueda está vacío', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({
      drinks: [{ idDrink: '11000', strDrink: 'Mojito' }],
    });

    const results = service.searchLocal('   ', 'name');
    expect(results.length).toBe(1);
  });

  it('debería refrescar el catálogo en memoria cuando la caché supera el TTL de 24 h', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [{ idDrink: '11000', strDrink: 'Mojito' }] });

    const internals = service as unknown as {
      catalogCachedAt: number;
      refreshCatalogIfStale(): void;
    };

    internals.catalogCachedAt = Date.now() - 25 * 60 * 60 * 1000;
    internals.refreshCatalogIfStale();

    const refetch = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    refetch.flush({ drinks: [{ idDrink: '11000', strDrink: 'Mojito' }] });
  });

  it('no debería refrescar el catálogo mientras la caché en memoria sea válida', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [{ idDrink: '11000', strDrink: 'Mojito' }] });

    const internals = service as unknown as { refreshCatalogIfStale(): void };
    internals.refreshCatalogIfStale();

    httpMock.expectNone(`${environment.cocktailApiUrl}/search.php?f=a`);
  });

  it('debería recibir los favoritos de otra pestaña por el canal de sincronización', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    const channel = BroadcastChannelStub.instances[0];
    channel.onmessage?.({ data: { type: 'FAVS_UPDATED', favorites: ['11000'] } });

    expect(service.isFavorite('11000')).toBe(true);
  });

  it('debería ignorar mensajes de sincronización con datos inválidos', () => {
    const req = httpMock.expectOne(`${environment.cocktailApiUrl}/search.php?f=a`);
    req.flush({ drinks: [] });

    const channel = BroadcastChannelStub.instances[0];
    channel.onmessage?.({ data: { type: 'FAVS_UPDATED', favorites: 'no-es-un-arreglo' } });
    channel.onmessage?.({ data: { type: 'FAVS_UPDATED' } });

    expect(service.isFavorite('11000')).toBe(false);
  });
});
