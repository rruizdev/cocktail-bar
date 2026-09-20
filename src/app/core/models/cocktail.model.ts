export interface Cocktail {
  idDrink: string;
  strDrink: string;
  strCategory?: string;
  strAlcoholic?: string;
  strGlass?: string;
  strInstructions: string;
  strDrinkThumb: string;
  ingredients: { name: string; measure: string }[];
}

export interface CocktailApiResponse {
  drinks: any[] | null;
}
