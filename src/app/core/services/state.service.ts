import { Injectable } from '@angular/core';
import { SearchState } from '../models/search.model';
import { SearchType } from '../models/search-type.model';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private searchState: SearchState = {
    term: '',
    type: 'name',
    onlyFavorites: false,
  };

  saveState(term: string, type: SearchType, onlyFavorites: boolean): void {
    this.searchState = { term, type, onlyFavorites };
  }

  getState(): SearchState {
    return this.searchState;
  }
}
