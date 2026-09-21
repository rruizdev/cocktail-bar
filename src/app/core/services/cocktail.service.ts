import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, of, tap } from 'rxjs';
import { Cocktail, CocktailApiResponse } from '../models/cocktail.model';
import { environment } from '../../../environments/environment';

const CATALOG_TTL_MS = 24 * 60 * 60 * 1000; 

interface StoredCatalog {
  storedAt: number;
  cocktails: Cocktail[];
}

@Injectable({
  providedIn: 'root'
})
export class CocktailService {  
  private storageKey = 'coto_cocktails_catalog';
  private favoritesKey = 'coto_cocktail_favorites';
  private broadcastChannel = new BroadcastChannel('coto_cocktails_sync');

  private catalogSubject = new BehaviorSubject<Cocktail[]>(this.loadCatalogFromStorage());
  public catalog$ = this.catalogSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        if (event.data?.type === 'FAVS_UPDATED') {
          this.favoritesSubject.next([...event.data.favorites]);
        } else if (event.data?.type === 'CATALOG_UPDATED') {
          this.catalogSubject.next([...event.data.catalog]);
        }
      });
    };

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
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const stored: StoredCatalog = JSON.parse(raw);
      if (Date.now() - stored.storedAt > CATALOG_TTL_MS) {
        localStorage.removeItem(this.storageKey);
        return [];
      }
      return stored.cocktails ?? [];
    } catch {
      try {
        const legacy: Cocktail[] = JSON.parse(raw);
        if (Array.isArray(legacy)) return legacy;
      } catch { /* ignorar */ }
      return [];
    }
  }

  private loadFavoritesFromStorage(): string[] {
    const stored = localStorage.getItem(this.favoritesKey);
    return stored ? JSON.parse(stored) : [];
  }

  public toggleFavorite(idDrink: string): void {
    let currentFavs = [...this.favoritesSubject.value];
    if (currentFavs.includes(idDrink)) {
      currentFavs = currentFavs.filter(id => id !== idDrink);
    } else {
      currentFavs.push(idDrink);
    }
    
    localStorage.setItem(this.favoritesKey, JSON.stringify(currentFavs));
    this.favoritesSubject.next(currentFavs);

    this.broadcastChannel.postMessage({
      type: 'FAVS_UPDATED',
      favorites: currentFavs
    });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  private initCatalog(): void {
    this.http.get<CocktailApiResponse>(`${environment.cocktailApiUrl}/search.php?f=a`).pipe(
      map(res => this.parseCocktails(res.drinks))
    ).subscribe(cocktails => {
      if (cocktails.length > 0) {
        this.persistCatalog(cocktails);
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
    let endpoint = `${environment.cocktailApiUrl}/search.php?s=${term}`;
    if (type === 'id') endpoint = `${environment.cocktailApiUrl}/lookup.php?i=${term}`;
    if (type === 'ingredient') endpoint = `${environment.cocktailApiUrl}/filter.php?i=${term}`;

    return this.http.get<CocktailApiResponse>(endpoint).pipe(
      map(res => this.parseCocktails(res.drinks)),
      tap(newCocktails => {
        if (newCocktails.length > 0) {
          const current = this.catalogSubject.value;
          const existingIds = new Set(current.map(c => c.idDrink));
          const merged = [...current, ...newCocktails.filter(c => !existingIds.has(c.idDrink))];
          this.persistCatalog(merged);
          this.catalogSubject.next(merged);
          this.broadcastChannel.postMessage({ type: 'CATALOG_UPDATED', catalog: merged });
        }
      })
    );
  }

  private persistCatalog(cocktails: Cocktail[]): void {
    const payload: StoredCatalog = { storedAt: Date.now(), cocktails };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
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
