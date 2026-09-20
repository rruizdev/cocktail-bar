import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private searchState = {
    term: '',
    type: 'name' as 'name' | 'ingredient' | 'id',
    onlyFavorites: false,
    scrollPosition: [0, 0] as [number, number]
  };

  saveState(term: string, type: 'name' | 'ingredient' | 'id', onlyFavorites: boolean): void {
    this.searchState.term = term;
    this.searchState.type = type;
    this.searchState.onlyFavorites = onlyFavorites;
    this.searchState.scrollPosition = [window.scrollX, window.scrollY];
  }

  getState() {
    return this.searchState;
  }
}
