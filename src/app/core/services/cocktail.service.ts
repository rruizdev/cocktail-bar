import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Cocktail, CocktailApiDrink, CocktailApiResponse } from '../models/cocktail.model';
import { Ingredient } from '../models/ingredient.model';
import { SearchType } from '../models/search-type.model';
import { environment } from '../../../environments/environment';

const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const SYNC_CHANNEL = 'coto_cocktails_sync';

@Injectable({
  providedIn: 'root',
})
export class CocktailService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  private readonly broadcastChannel = new BroadcastChannel(SYNC_CHANNEL);

  private readonly catalogSubject = new BehaviorSubject<Cocktail[]>([]);
  public readonly catalog$ = this.catalogSubject.asObservable();
  private catalogCachedAt = 0;

  private readonly favoritesSubject = new BehaviorSubject<string[]>([]);
  public readonly favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.broadcastChannel.onmessage = (event) => {
      this.ngZone.run(() => {
        if (event.data?.type === 'FAVS_UPDATED' && Array.isArray(event.data.favorites)) {
          this.favoritesSubject.next([...event.data.favorites]);
        } else if (event.data?.type === 'CATALOG_UPDATED' && Array.isArray(event.data.catalog)) {
          this.applyCatalog(event.data.catalog, Number(event.data.cachedAt) || Date.now());
        }
      });
    };

    this.refreshCatalogIfStale();
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

    this.favoritesSubject.next(favorites);

    this.broadcastChannel.postMessage({ type: 'FAVS_UPDATED', favorites });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  private refreshCatalogIfStale(): void {
    if (this.catalogSubject.value.length === 0 || this.isCatalogStale()) {
      this.initCatalog();
    }
  }

  private isCatalogStale(): boolean {
    return this.catalogCachedAt === 0 || Date.now() - this.catalogCachedAt > CATALOG_TTL_MS;
  }

  private initCatalog(): void {
    this.http
      .get<CocktailApiResponse>(`${environment.cocktailApiUrl}/search.php?f=a`)
      .subscribe((res) => {
        const cocktails = this.parseCocktails(res.drinks);
        if (cocktails.length > 0) {
          this.applyCatalog(cocktails, Date.now());
          this.broadcastChannel.postMessage({
            type: 'CATALOG_UPDATED',
            catalog: cocktails,
            cachedAt: this.catalogCachedAt,
          });
        }
      });
  }

  private applyCatalog(cocktails: Cocktail[], cachedAt: number): void {
    this.catalogCachedAt = cachedAt;
    this.catalogSubject.next(cocktails);
  }

  private parseCocktails(drinks: CocktailApiDrink[] | null): Cocktail[] {
    if (!drinks) return [];

    return drinks.map((drink) => {
      const ingredients: Ingredient[] = [];

      for (let i = 1; i <= 15; i++) {
        const name = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (name && name.trim() !== '') {
          ingredients.push({
            name: name.trim(),
            measure: measure ? measure.trim() : '',
          });
        }
      }

      return {
        idDrink: drink.idDrink,
        strDrink: drink.strDrink,
        strCategory: drink.strCategory ?? undefined,
        strAlcoholic: drink.strAlcoholic ?? undefined,
        strGlass: drink.strGlass ?? undefined,
        strInstructions: drink.strInstructions || 'Sin instrucciones detalladas.',
        strDrinkThumb: drink.strDrinkThumb ?? '',
        ingredients,
      };
    });
  }
}
