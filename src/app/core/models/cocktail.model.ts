import { Ingredient } from "./Ingredient.model";

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


