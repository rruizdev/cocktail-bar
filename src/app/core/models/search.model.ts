export type SearchType = 'name' | 'ingredient' | 'id';

export interface SearchState {
  term: string;
  type: SearchType;
  onlyFavorites: boolean;
  scrollPosition: [number, number];
}

