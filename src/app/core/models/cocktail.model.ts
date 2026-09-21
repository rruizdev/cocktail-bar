export interface Ingredient {
  name: string;
  measure: string;
}

export interface Cocktail {
  idDrink: string;
  strDrink: string;
  strCategory?: string;
  strAlcoholic?: string;
  strGlass?: string;
  strInstructions: string;
  strDrinkThumb: string;
  ingredients: Ingredient[];
}

export interface CocktailApiResponse {
  drinks: any[] | null;
}

export interface StoredCatalog {
  storedAt: number;
  cocktails: Cocktail[];
}
