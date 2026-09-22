import { SearchType } from './search-type.model';

export interface SearchState {
  term: string;
  type: SearchType;
  onlyFavorites: boolean;
}
