import { Cocktail } from './cocktail.model';

export interface StoredCatalog {
  storedAt: number;
  cocktails: Cocktail[];
}
