import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, of, tap } from 'rxjs';
import { Cocktail, CocktailApiResponse } from '../models/cocktail.model';

@Injectable({
  providedIn: 'root'
})
export class CocktailService {
  private apiUrl = 'https://www.thecocktaildb.com/api/json/v1/1';
  
  private storageKey = 'coto_cocktails_catalog';
  private favoritesKey = 'coto_cocktail_favorites';
  private broadcastChannel = new BroadcastChannel('coto_cocktails_sync');

  // Estado reactivo en memoria
  private catalogSubject = new BehaviorSubject<Cocktail[]>(this.loadCatalogFromStorage());
  public catalog$ = this.catalogSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Escuchar eventos de sincronización entre pestañas
    this.broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'FAVS_UPDATED') {
        this.favoritesSubject.next(event.data.favorites);
      } else if (event.data?.type === 'CATALOG_UPDATED') {
        this.catalogSubject.next(event.data.catalog);
      }
    };

    // Carga inicial rápida si el storage local está vacío
    if (this.catalogSubject.value.length === 0) {
      this.initCatalog();
    }
  }

  // --- PERSISTENCIA LOCAL ---

  private loadCatalogFromStorage(): Cocktail[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  private loadFavoritesFromStorage(): string[] {
    const stored = localStorage.getItem(this.favoritesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveCatalog(catalog: Cocktail[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(catalog));
    this.catalogSubject.next(catalog);
    this.broadcastChannel.postMessage({ type: 'CATALOG_UPDATED', catalog });
  }

  public toggleFavorite(idDrink: string): void {
    let currentFavs = this.loadFavoritesFromStorage();
    if (currentFavs.includes(idDrink)) {
      currentFavs = currentFavs.filter(id => id !== idDrink);
    } else {
      currentFavs.push(idDrink);
    }
    
    localStorage.setItem(this.favoritesKey, JSON.stringify(currentFavs));
    this.favoritesSubject.next(currentFavs);

    // Notificar a las demás pestañas de forma instantánea
    this.broadcastChannel.postMessage({ type: 'FAVS_UPDATED', favorites: currentFavs });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  // --- SEMILLA INICIAL (Descarga única y ligera) ---

  private initCatalog(): void {
    // Traemos un lote inicial liviano para arrancar al instante sin demoras
    this.http.get<CocktailApiResponse>(`${this.apiUrl}/search.php?f=a`).pipe(
      map(res => this.parseCocktails(res.drinks))
    ).subscribe(cocktails => {
      if (cocktails.length > 0) {
        this.saveCatalog(cocktails);
      }
    });
  }

  // --- BÚSQUEDAS LOCALES (0ms de latencia de red) ---

  searchLocal(term: string, type: 'name' | 'ingredient' | 'id'): Observable<Cocktail[]> {
    const cleanTerm = term.trim().toLowerCase();
    const currentCatalog = this.catalogSubject.value;

    if (!cleanTerm) {
      return of(currentCatalog);
    }

    // Si la búsqueda no está en el catálogo local, hacemos un fetch puntual a la API
    const matches = currentCatalog.filter(c => {
      if (type === 'name') return c.strDrink.toLowerCase().includes(cleanTerm);
      if (type === 'id') return c.idDrink === cleanTerm;
      if (type === 'ingredient') return c.ingredients.some(i => i.name.toLowerCase().includes(cleanTerm));
      return false;
    });

    if (matches.length > 0) {
      return of(matches);
    }

    // Fallback a la API solo si no hay resultados locales, y lo sumamos al almacenamiento
    return this.fetchFromApiAndMerge(cleanTerm, type);
  }

  private fetchFromApiAndMerge(term: string, type: 'name' | 'ingredient' | 'id'): Observable<Cocktail[]> {
    let endpoint = `${this.apiUrl}/search.php?s=${term}`;
    if (type === 'id') endpoint = `${this.apiUrl}/lookup.php?i=${term}`;
    if (type === 'ingredient') endpoint = `${this.apiUrl}/filter.php?i=${term}`;

    return this.http.get<CocktailApiResponse>(endpoint).pipe(
      map(res => this.parseCocktails(res.drinks)),
      tap(newCocktails => {
        if (newCocktails.length > 0) {
          const current = this.loadCatalogFromStorage();
          const existingIds = new Set(current.map(c => c.idDrink));
          const merged = [...current, ...newCocktails.filter(c => !existingIds.has(c.idDrink))];
          this.saveCatalog(merged);
        }
      })
    );
  }

  private parseCocktails(drinks: any[] | null): Cocktail[] {
    if (!drinks) return [];
    
    return drinks.map(drink => {
      const ingredients: { name: string; measure: string }[] = [];
      
      for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== '') {
          ingredients.push({
            name: ingredient.trim(),
            measure: measure ? measure.trim() : ''
          });
        }
      }

      return {
        idDrink: drink.idDrink,
        strDrink: drink.strDrink,
        strCategory: drink.strCategory,
        strAlcoholic: drink.strAlcoholic,
        strGlass: drink.strGlass,
        strInstructions: drink.strInstructions || 'Sin instrucciones detalladas.',
        strDrinkThumb: drink.strDrinkThumb,
        ingredients
      };
    });
  }
}
