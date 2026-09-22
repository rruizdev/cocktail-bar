import { Ingredient } from './ingredient.model';

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

export interface CocktailApiDrink {
  idDrink: string;
  strDrink: string;
  strCategory?: string | null;
  strAlcoholic?: string | null;
  strGlass?: string | null;
  strInstructions?: string | null;
  strDrinkThumb?: string | null;
  [key: `strIngredient${number}`]: string | null | undefined;
  [key: `strMeasure${number}`]: string | null | undefined;
}

export interface CocktailApiResponse {
  drinks: CocktailApiDrink[] | null;
}
