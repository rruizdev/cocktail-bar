import { Injectable, NgZone } from '@angular/core';
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

  private catalogSubject = new BehaviorSubject<Cocktail[]>(this.loadCatalogFromStorage());
  public catalog$ = this.catalogSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient, private ngZone: NgZone) {
    // Escuchar el canal entre pestañas
    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        if (event.data?.type === 'FAVS_UPDATED') {
          this.favoritesSubject.next([...event.data.favorites]);
        } else if (event.data?.type === 'CATALOG_UPDATED') {
          this.catalogSubject.next([...event.data.catalog]);
        }
      });
    };

    // Escuchar storage nativo por si la pestaña estuvo dormida
    window.addEventListener('storage', (event) => {
      if (event.key === this.favoritesKey && event.newValue) {
        this.ngZone.run(() => {
          this.favoritesSubject.next(JSON.parse(event.newValue!));
        });
      }
    });

    if (this.catalogSubject.value.length === 0) {
      this.initCatalog();
    }
  }

  private loadCatalogFromStorage(): Cocktail[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  private loadFavoritesFromStorage(): string[] {
    const stored = localStorage.getItem(this.favoritesKey);
    return stored ? JSON.parse(stored) : [];
  }

  public toggleFavorite(idDrink: string): void {
    let currentFavs = this.loadFavoritesFromStorage();
    if (currentFavs.includes(idDrink)) {
      currentFavs = currentFavs.filter(id => id !== idDrink);
    } else {
      currentFavs.push(idDrink);
    }
    
    localStorage.setItem(this.favoritesKey, JSON.stringify(currentFavs));
    this.favoritesSubject.next([...currentFavs]);

    // Emitir a otras pestañas
    this.broadcastChannel.postMessage({
      type: 'FAVS_UPDATED',
      favorites: currentFavs
    });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  private initCatalog(): void {
    this.http.get<CocktailApiResponse>(`${this.apiUrl}/search.php?f=a`).pipe(
      map(res => this.parseCocktails(res.drinks))
    ).subscribe(cocktails => {
      if (cocktails.length > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(cocktails));
        this.catalogSubject.next(cocktails);
      }
    });
  }

  searchLocal(term: string, type: 'name' | 'ingredient' | 'id'): Observable<Cocktail[]> {
    const cleanTerm = term.trim().toLowerCase();
    const currentCatalog = this.catalogSubject.value;

    if (!cleanTerm) {
      return of(currentCatalog);
    }

    const matches = currentCatalog.filter(c => {
      if (type === 'name') return c.strDrink.toLowerCase().includes(cleanTerm);
      if (type === 'id') return c.idDrink === cleanTerm;
      if (type === 'ingredient') return c.ingredients.some(i => i.name.toLowerCase().includes(cleanTerm));
      return false;
    });

    return of(matches);
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
          localStorage.setItem(this.storageKey, JSON.stringify(merged));
          this.catalogSubject.next(merged);
          this.broadcastChannel.postMessage({ type: 'CATALOG_UPDATED', catalog: merged });
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
