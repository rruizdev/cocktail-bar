import { Injectable } from '@angular/core';
import { SearchState } from '../models/search.model';
import { SearchType } from "../models/search-type.model";

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private searchState: SearchState = {
    term: '',
    type: 'name',
    onlyFavorites: false,
    scrollPosition: [0, 0]
  };

  saveState(term: string, type: SearchType, onlyFavorites: boolean): void {
    this.searchState.term = term;
    this.searchState.type = type;
    this.searchState.onlyFavorites = onlyFavorites;
    this.searchState.scrollPosition = [window.scrollX, window.scrollY];
  }

  getState(): SearchState {
    return this.searchState;
  }
}
