import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Cocktail, CocktailApiResponse } from '../models/cocktail.model';
import { StoredCatalog } from '../models/stored-catalog.model';
import { Ingredient } from '../models/Ingredient.model';
import { SearchType } from '../models/search-type.model';
import { environment } from '../../../environments/environment';

const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class CocktailService {
  private storageKey = 'coto_cocktails_catalog';
  private favoritesKey = 'coto_cocktail_favorites';
  private broadcastChannel = new BroadcastChannel('coto_cocktails_sync');

  private catalogSubject = new BehaviorSubject<Cocktail[]>(this.loadCatalogFromStorage());
  public catalog$ = this.catalogSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {
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

  public searchLocal(term: string, type: SearchType): Cocktail[] {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return this.catalogSubject.value;

    return this.catalogSubject.value.filter((c) =>
      type === 'name'
        ? c.strDrink.toLowerCase().includes(cleanTerm)
        : type === 'id'
          ? c.idDrink === cleanTerm
          : c.ingredients.some((i) => i.name.toLowerCase().includes(cleanTerm)),
    );
  }

  public toggleFavorite(idDrink: string): void {
    const current = this.favoritesSubject.value;
    const favorites = current.includes(idDrink)
      ? current.filter((id) => id !== idDrink)
      : [...current, idDrink];

    localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites);

    this.broadcastChannel.postMessage({ type: 'FAVS_UPDATED', favorites });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  private loadCatalogFromStorage(): Cocktail[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object' && 'storedAt' in parsed) {
        const stored: StoredCatalog = parsed;
        if (Date.now() - stored.storedAt > CATALOG_TTL_MS) {
          localStorage.removeItem(this.storageKey);
          return [];
        }
        return stored.cocktails ?? [];
      }
      return [];
    } catch {
      return [];
    }
  }

  private loadFavoritesFromStorage(): string[] {
    const stored = localStorage.getItem(this.favoritesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private initCatalog(): void {
    this.http
      .get<CocktailApiResponse>(`${environment.cocktailApiUrl}/search.php?f=a`)
      .subscribe((res) => {
        const cocktails = this.parseCocktails(res.drinks);
        if (cocktails.length > 0) {
          this.persistCatalog(cocktails);
          this.catalogSubject.next(cocktails);
        }
      });
  }

  private persistCatalog(cocktails: Cocktail[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify({ storedAt: Date.now(), cocktails }));
  }

  private parseCocktails(drinks: any[] | null): Cocktail[] {
    if (!drinks) return [];

    return drinks.map((drink) => {
      const ingredients: Ingredient[] = [];

      for (let i = 1; i <= 15; i++) {
        const name = drink[`strIngredient${i}`];
        if (name && name.trim() !== '') {
          ingredients.push({
            name: name.trim(),
            measure: drink[`strMeasure${i}`] ? drink[`strMeasure${i}`].trim() : '',
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
        ingredients,
      };
    });
  }
}
