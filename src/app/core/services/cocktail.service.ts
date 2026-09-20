import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Cocktail, CocktailApiResponse } from '../models/cocktail.model';

@Injectable({
  providedIn: 'root'
})
export class CocktailService {
  private apiUrl = 'https://www.thecocktaildb.com/api/json/v1/1';
  
  // Manejo de Favoritos sincronizado
  private favoritesKey = 'coto_cocktail_favorites';
  private broadcastChannel = new BroadcastChannel('coto_cocktails_sync');
  
  private favoritesSubject = new BehaviorSubject<string[]>(this.loadFavoritesFromStorage());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Escuchar cambios de otras pestañas vía BroadcastChannel
    this.broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'FAVS_UPDATED') {
        this.favoritesSubject.next(event.data.favorites);
      }
    };
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
    this.favoritesSubject.next(currentFavs);

    // Notificar a las demás pestañas abiertas
    this.broadcastChannel.postMessage({
      type: 'FAVS_UPDATED',
      favorites: currentFavs
    });
  }

  public isFavorite(idDrink: string): boolean {
    return this.favoritesSubject.value.includes(idDrink);
  }

  // --- Métodos de la API ---
  
  searchByName(name: string): Observable<Cocktail[]> {
    return this.http.get<CocktailApiResponse>(`${this.apiUrl}/search.php?s=${name}`).pipe(
      map(response => this.parseCocktails(response.drinks))
    );
  }

  searchByIngredient(ingredient: string): Observable<Cocktail[]> {
    return this.http.get<CocktailApiResponse>(`${this.apiUrl}/filter.php?i=${ingredient}`).pipe(
      map(response => this.parseCocktails(response.drinks))
    );
  }

  searchById(id: string): Observable<Cocktail[]> {
    return this.http.get<CocktailApiResponse>(`${this.apiUrl}/lookup.php?i=${id}`).pipe(
      map(response => this.parseCocktails(response.drinks))
    );
  }

  // Utilidad para normalizar los ingredientes que vienen en propiedades separadas (strIngredient1, strMeasure1...)
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
